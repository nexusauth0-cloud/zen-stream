import { describe, expect, it, vi, afterEach } from "vitest";
import request from "supertest";
import type { MediaUpstreamClient } from "./client.js";
import type {
  MediaHomeFeed,
  MediaHomeRows,
  MediaHomeSubjects,
  MediaInfo,
  MediaSearchResponse,
  MediaSeasonResponse,
  MediaStreamResponse,
} from "@zen-stream/contracts";
import { UpstreamHttpError } from "./client.js";
import { createApp } from "../app.js";
import { ProviderRegistry } from "../providers/registry.js";
import { createTmdBProvider } from "../providers/tmdb/provider.js";
import { resetTmdBGenreCache } from "../providers/tmdb/client.js";
import { createSpunProvider } from "../providers/spun/provider.js";
import { createDaratechProvider } from "../providers/daratech/provider.js";
import type { MediaProvider } from "../providers/types.js";

function fakeClient(overrides: Partial<MediaUpstreamClient> = {}): MediaUpstreamClient {
  return {
    fetchHome: vi.fn<() => Promise<MediaHomeFeed>>(async () => ({
      total: 1,
      rows: [
        {
          title: "Nollywood Movie",
          opId: "op-1",
          type: "SUBJECTS_MOVIE",
          total: 1,
          subjects: [
            {
              subjectId: "6021098917113354936",
              type: "movie",
              title: "YOURS BEFORE WORDS",
              poster: "https://pbcdn.example/poster.jpg",
              hasResource: true,
              description: null,
              releaseDate: null,
              runtime: null,
              genre: null,
              rating: null,
              language: null,
              country: null,
            },
          ],
        },
      ],
    })),
    fetchHomeRows: vi.fn<() => Promise<MediaHomeRows>>(async () => ({
      total: 1,
      rows: [{ title: "Nollywood Movie", opId: "op-1" }],
    })),
    fetchHomeSubjects: vi.fn<(opId: string) => Promise<MediaHomeSubjects>>(async (opId: string) => ({
      opId,
      title: "Nollywood Movie",
      total: 1,
      subjects: [
        {
          subjectId: "6021098917113354936",
          type: "movie",
          title: "YOURS BEFORE WORDS",
          poster: null,
          hasResource: true,
          description: null,
          releaseDate: null,
          runtime: null,
          genre: null,
          rating: null,
          language: null,
          country: null,
        },
      ],
    })),
    fetchSearch: vi.fn<() => Promise<MediaSearchResponse>>(async () => ({
      items: [
        {
          subjectId: "1654274595068805784",
          type: "movie",
          title: "Avatar [Hindi]",
          releaseDate: "2009-12-18",
          duration: "2h 42m",
          genre: "Action",
          poster: null,
          rating: 7.9,
          language: null,
          country: null,
        },
      ],
      pager: { hasMore: true, page: 1, perPage: 20, totalCount: 200 },
    })),
    fetchInfo: vi.fn<() => Promise<MediaInfo>>(async () => ({
      subjectId: "1654274595068805784",
      type: "movie",
      title: "Avatar [Hindi]",
      description: "A paraplegic Marine.",
      releaseDate: "2009-12-18",
      runtime: 162,
      genre: "Action, Adventure, Fantasy",
      poster: null,
      backdrop: null,
      country: "United States",
      rating: 7.9,
      hasResource: true,
      language: "English",
      staff: [],
      externalIds: { moviebox: null, spun: null, daratech: null, imdb: null, tmdb: null },
    })),
    fetchSeason: vi.fn<() => Promise<MediaSeasonResponse>>(async () => ({
      seasons: [
        {
          season: 1,
          totalEpisode: 8,
          episodesAvailable: 8,
          resolutions: [{ resolution: 1080, epNum: 7 }],
          episodes: [{ episode: 1, title: null, releaseDate: null }],
        },
      ],
    })),
    fetchStream: vi.fn<() => Promise<MediaStreamResponse>>(async () => ({
      streams: [
        {
          quality: "1080p",
          resolution: 1080,
          url: "https://relay.example/media/x",
          format: "mp4",
          size: "426 MB",
          codecName: "hevc",
          duration: 4005,
          captions: [],
          se: 0,
          ep: 0,
        },
      ],
      total: 1,
    })),
    ...overrides,
  };
}

const UPSTREAM_SECRET = "super-secret-value";

function failingPrimary(overrides: Partial<MediaProvider> = {}): MediaProvider {
  return {
    id: "moviebox",
    name: "MovieBox",
    fetchHome: async () => ({ total: 0, rows: [] }),
    fetchHomeRows: async () => ({ total: 0, rows: [] }),
    fetchHomeSubjects: async (opId: string) => ({ opId, title: "Row", total: 0, subjects: [] }),
    fetchSearch: async () => {
      throw new UpstreamHttpError(502, "Upstream media search is temporarily unavailable");
    },
    fetchInfo: async () => {
      throw new UpstreamHttpError(404, "Not found");
    },
    fetchSeason: async () => ({ seasons: [] }),
    ...overrides,
  };
}

function tmdbFetch(fixtures: Record<string, unknown>) {
  return vi.fn(async (url: string) => {
    for (const [suffix, body] of Object.entries(fixtures)) {
      if (url.includes(suffix)) return new Response(JSON.stringify(body), { status: 200 });
    }
    throw new Error(`unexpected tmdb url ${url}`);
  });
}

const TMDB_SEARCH_FIXTURES = {
  "/search/multi": {
    page: 1,
    total_pages: 1,
    total_results: 1,
    results: [
      {
        id: 27205,
        media_type: "movie",
        title: "Inception",
        release_date: "2010-07-15",
        poster_path: "/x.jpg",
        vote_average: 8.4,
        genre_ids: [28],
        original_language: "en",
      },
    ],
  },
  "/genre/movie/list": { genres: [{ id: 28, name: "Action" }] },
  "/genre/tv/list": { genres: [] },
};

const TMDB_INFO_FIXTURES = {
  "/movie/27205?": {
    id: 27205,
    title: "Inception",
    overview: "A thief who steals corporate secrets.",
    release_date: "2010-07-15",
    poster_path: "/inception.jpg",
    vote_average: 8.4,
    runtime: 148,
    genres: [{ id: 28, name: "Action" }],
    production_countries: [{ iso_3166_1: "US" }],
    external_ids: { imdb_id: "tt1375666" },
  },
};

function registryWithTmdb(primary: MediaProvider, fetchImpl: ReturnType<typeof tmdbFetch>): ProviderRegistry {
  const registry = new ProviderRegistry();
  registry.registerMetadata(primary);
  registry.registerSecondary(createTmdBProvider({ apiKey: "tmdb-test-key" }, fetchImpl));
  return registry;
}

describe("GET /api/v1/media/home", () => {
  it("returns the normalized home feed", async () => {
    const client = fakeClient();
    const app = createApp({ mediaClient: client });

    const response = await request(app).get("/api/v1/media/home");

    expect(response.status).toBe(200);
    expect(response.body.rows[0].title).toBe("Nollywood Movie");
    expect(response.body.rows[0].subjects[0]).toMatchObject({
      subjectId: "6021098917113354936",
      type: "movie",
      hasResource: true,
    });
    expect(client.fetchHome).toHaveBeenCalledOnce();
  });
});

describe("GET /api/v1/media/home/rows", () => {
  it("returns the lightweight row list", async () => {
    const app = createApp({ mediaClient: fakeClient() });

    const response = await request(app).get("/api/v1/media/home/rows");

    expect(response.status).toBe(200);
    expect(response.body.rows).toEqual([{ title: "Nollywood Movie", opId: "op-1" }]);
  });
});

describe("GET /api/v1/media/home/subjects", () => {
  it("forwards a valid opId", async () => {
    const client = fakeClient();
    const app = createApp({ mediaClient: client });

    const response = await request(app).get("/api/v1/media/home/subjects?opId=op-1");

    expect(response.status).toBe(200);
    expect(response.body.opId).toBe("op-1");
    expect(client.fetchHomeSubjects).toHaveBeenCalledWith("op-1");
  });

  it("rejects a missing opId", async () => {
    const app = createApp({ mediaClient: fakeClient() });

    const response = await request(app).get("/api/v1/media/home/subjects");

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /api/v1/media/search", () => {
  it("forwards a validated query", async () => {
    const client = fakeClient();
    const app = createApp({ mediaClient: client });

    const response = await request(app).get("/api/v1/media/search?q=avatar&page=2");

    expect(response.status).toBe(200);
    expect(response.body.items[0].title).toBe("Avatar [Hindi]");
    expect(client.fetchSearch).toHaveBeenCalledWith({ keyword: "avatar", page: 2, perPage: 20 });
  });

  it("rejects an empty query", async () => {
    const app = createApp({ mediaClient: fakeClient() });

    const response = await request(app).get("/api/v1/media/search");

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /api/v1/media/info/:subjectId", () => {
  it("returns normalized subject details", async () => {
    const client = fakeClient();
    const app = createApp({ mediaClient: client });

    const response = await request(app).get("/api/v1/media/info/1654274595068805784");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      subjectId: "1654274595068805784",
      type: "movie",
      title: "Avatar [Hindi]",
      hasResource: true,
    });
  });

  it("rejects a missing subject id", async () => {
    const app = createApp({ mediaClient: fakeClient() });

    const response = await request(app).get("/api/v1/media/info/%20");

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /api/v1/media/season/:subjectId", () => {
  it("returns normalized seasons", async () => {
    const app = createApp({ mediaClient: fakeClient() });

    const response = await request(app).get("/api/v1/media/season/5139196938264400928");

    expect(response.status).toBe(200);
    expect(response.body.seasons[0].episodesAvailable).toBe(8);
  });
});

describe("GET /api/v1/media/stream/:subjectId", () => {
  it("forwards season and episode params", async () => {
    const client = fakeClient();
    const app = createApp({ mediaClient: client });

    const response = await request(app).get("/api/v1/media/stream/123?se=5&ep=8");

    expect(response.status).toBe(200);
    expect(response.body.streams[0].quality).toBe("1080p");
    expect(client.fetchStream).toHaveBeenCalledWith("123", { se: 5, ep: 8 });
  });

  it("defaults to movie params when se/ep are omitted", async () => {
    const client = fakeClient();
    const app = createApp({ mediaClient: client });

    await request(app).get("/api/v1/media/stream/123");

    expect(client.fetchStream).toHaveBeenCalledWith("123", { se: 0, ep: 0 });
  });

  it("rejects negative episode indexes", async () => {
    const app = createApp({ mediaClient: fakeClient() });

    const response = await request(app).get("/api/v1/media/stream/123?ep=-1");

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("upstream failures", () => {
  afterEach(() => {
    delete process.env.MEDIA_API_BASE_URL;
    delete process.env.MEDIA_API_SECRET;
  });

  it("maps upstream HTTP failures to a consistent 502", async () => {
    const client = fakeClient({
      fetchHome: vi.fn(async () => {
        throw new UpstreamHttpError(500, "Upstream media API responded with 500.");
      }),
    });
    const app = createApp({ mediaClient: client });

    const response = await request(app).get("/api/v1/media/home");

    expect(response.status).toBe(502);
    expect(response.body.error.code).toBe("MEDIA_UPSTREAM_ERROR");
    expect(JSON.stringify(response.body)).not.toContain("Upstream media API responded");
  });

  it("maps invalid upstream payloads to a 502 without leaking details", async () => {
    const client = fakeClient({
      fetchInfo: vi.fn(async () => {
        throw new Error("boom");
      }),
    });
    const app = createApp({ mediaClient: client });

    const response = await request(app).get("/api/v1/media/info/123");

    expect(response.status).toBe(500);
    expect(JSON.stringify(response.body)).not.toContain("boom");
    expect(response.body.error.code).toBe("INTERNAL_ERROR");
  });

  it("responds 503 when the media API is not configured", async () => {
    const app = createApp();

    const response = await request(app).get("/api/v1/media/home");

    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe("MEDIA_NOT_CONFIGURED");
  });

  it("never exposes the upstream secret", async () => {
    process.env.MEDIA_API_BASE_URL = "https://media.example";
    process.env.MEDIA_API_SECRET = UPSTREAM_SECRET;
    const client = fakeClient({
      fetchHome: vi.fn(async () => {
        throw new Error("secret leaked?");
      }),
    });
    const app = createApp({ mediaClient: client });

    const response = await request(app).get("/api/v1/media/home");

    expect(JSON.stringify(response.body)).not.toContain(UPSTREAM_SECRET);
    expect(JSON.stringify(response.body)).not.toContain("secret leaked?");
  });
});

describe("secondary metadata fallback (TMDB)", () => {
  afterEach(() => {
    resetTmdBGenreCache();
  });

  it("falls back to TMDB search when the primary search fails", async () => {
    const fetchImpl = tmdbFetch(TMDB_SEARCH_FIXTURES);
    const app = createApp({
      providers: registryWithTmdb(failingPrimary(), fetchImpl),
    });

    const response = await request(app).get("/api/v1/media/search?q=inception");

    expect(response.status).toBe(200);
    expect(response.body.items[0]).toMatchObject({
      subjectId: "movie:27205",
      type: "movie",
      title: "Inception",
      genre: "Action",
    });
  });

  it("does NOT consult TMDB when the primary search succeeds, even with zero results", async () => {
    const fetchImpl = tmdbFetch(TMDB_SEARCH_FIXTURES);
    const app = createApp({
      providers: registryWithTmdb(
        failingPrimary({
          fetchSearch: async () => ({
            items: [],
            pager: { hasMore: false, page: 1, perPage: 20, totalCount: 0 },
          }),
        }),
        fetchImpl,
      ),
    });

    const response = await request(app).get("/api/v1/media/search?q=zzzz");

    expect(response.status).toBe(200);
    expect(response.body.items).toEqual([]);
    // The TMDB mock throws on any unexpected call — a fallback would 502.
  });

  it("surfaces the primary search failure when no secondary is registered", async () => {
    const registry = new ProviderRegistry();
    registry.registerMetadata(failingPrimary());
    const app = createApp({ providers: registry });

    const response = await request(app).get("/api/v1/media/search?q=inception");

    expect(response.status).toBe(502);
    expect(response.body.error.code).toBe("MEDIA_UPSTREAM_ERROR");
  });

  it("surfaces the primary search failure when TMDB also fails", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    const app = createApp({
      providers: registryWithTmdb(failingPrimary(), fetchImpl),
    });

    const response = await request(app).get("/api/v1/media/search?q=inception");

    expect(response.status).toBe(502);
    expect(response.body.error.code).toBe("MEDIA_UPSTREAM_ERROR");
  });

  it("falls back to TMDB details when the primary info fails", async () => {
    const fetchImpl = tmdbFetch(TMDB_INFO_FIXTURES);
    const app = createApp({
      providers: registryWithTmdb(failingPrimary(), fetchImpl),
    });

    const response = await request(app).get("/api/v1/media/info/movie:27205");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      subjectId: "movie:27205",
      type: "movie",
      title: "Inception",
      hasResource: false,
    });
  });

  it("never lets TMDB details claim playability", async () => {
    const fetchImpl = tmdbFetch(TMDB_INFO_FIXTURES);
    const app = createApp({
      providers: registryWithTmdb(failingPrimary(), fetchImpl),
    });

    const response = await request(app).get("/api/v1/media/info/movie:27205");

    expect(response.status).toBe(200);
    expect(response.body.hasResource).toBe(false);
  });

  it("surfaces the primary info failure when TMDB cannot answer (foreign id)", async () => {
    const fetchImpl = tmdbFetch({});
    const app = createApp({
      providers: registryWithTmdb(failingPrimary(), fetchImpl),
    });

    const response = await request(app).get("/api/v1/media/info/6021098917113354936");

    expect(response.status).toBe(502);
    expect(response.body.error.code).toBe("MEDIA_UPSTREAM_ERROR");
  });
});

/* ── Multi-provider fallback (Spün + DaraTech) ─────────────────────────── */

const SPUN_SEARCH_FIXTURE = {
  page: 1,
  total_pages: 1,
  total_results: 2,
  results: [
    {
      spun_id: "the-matrix-387273",
      type: "movie",
      title: "The Matrix",
      year: 1999,
      rating: 8.3,
      poster: "https://image.tmdb.org/t/p/w342/x.jpg",
    },
    {
      spun_id: "the-matrix-reloaded-958850",
      type: "movie",
      title: "The Matrix Reloaded",
      year: 2003,
      rating: 7.1,
      poster: "https://image.tmdb.org/t/p/w342/y.jpg",
    },
  ],
};

const DARATECH_SEARCH_FIXTURE = {
  items: [
    {
      id: "NTgyMzEzNTc2ODIyNjcxMzM4NDo6OnBpY2E",
      subjectId: "NTgyMzEzNTc2ODIyNjcxMzM4NDo6OnBpY2E",
      title: "The Matrix",
      cover: "https://pbcdn.aoneroom.com/image/m.jpg",
      year: 1999,
      rating: 8.0,
      genres: ["Action"],
      subjectType: 1,
      language: "English",
    },
    {
      id: "MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDo6OnBpY2E",
      subjectId: "MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDo6OnBpY2E",
      title: "Sense8",
      cover: "https://pbcdn.aoneroom.com/image/s.jpg",
      year: 2015,
      rating: 8.2,
      genres: ["Sci-Fi"],
      subjectType: 2,
      language: "English",
    },
  ],
};

const SPUN_INFO_FIXTURE = {
  spun_id: "spider-man-brand-new-day-824972",
  type: "movie",
  title: "Spider-Man: Brand New Day",
  year: 2026,
  rating: 7.9,
  overview: "The web-slinger returns.",
  status: "Released",
  runtime: 132,
  genres: ["Action", "Adventure"],
  poster: "https://image.tmdb.org/t/p/w500/p.jpg",
  backdrop: "https://image.tmdb.org/t/p/w1280/b.jpg",
  cast: [{ name: "Tom Holland", character: "Spider-Man", image: "https://img/t.jpg" }],
};

const SPUN_RESOLVE_FIXTURE = {
  spun_id: "spider-man-brand-new-day-824972",
  type: "movie",
  title: "Spider-Man: Brand New Day",
  year: 2026,
  rating: 7.9,
  poster: null,
};

function secondaryFetch(fixtures: Record<string, unknown>) {
  return vi.fn(async (url: string) => {
    for (const [suffix, body] of Object.entries(fixtures)) {
      if (url.includes(suffix)) return new Response(JSON.stringify(body), { status: 200 });
    }
    throw new Error(`unexpected url ${url}`);
  });
}

function registryWithSecondaries(
  primary: MediaProvider,
  spunFetchImpl: ReturnType<typeof secondaryFetch>,
  daratechFetchImpl: ReturnType<typeof secondaryFetch>,
): ProviderRegistry {
  const registry = new ProviderRegistry();
  registry.registerMetadata(primary);
  registry.registerSecondary(createSpunProvider({ baseUrl: "https://media.byspun.xyz/v1" }, spunFetchImpl));
  registry.registerSecondary(
    createDaratechProvider(
      { apiKey: "dara-test-key", apiRoot: "https://apimovie.runflix.name.ng/v1" },
      daratechFetchImpl,
    ),
  );
  return registry;
}

describe("multi-provider search fallback", () => {
  it("merges Spün and DaraTech results and deduplicates exact title duplicates", async () => {
    const app = createApp({
      providers: registryWithSecondaries(
        failingPrimary(),
        secondaryFetch({ "/search?": SPUN_SEARCH_FIXTURE }),
        secondaryFetch({ "/search?": DARATECH_SEARCH_FIXTURE }),
      ),
    });

    const response = await request(app).get("/api/v1/media/search?q=the%20matrix");

    expect(response.status).toBe(200);
    // The Matrix (duplicate across providers) appears once — the Spün item
    // wins because it came first; The Matrix Reloaded and Sense8 are kept.
    const titles = response.body.items.map((item: { title: string }) => item.title);
    expect(titles).toEqual(["The Matrix", "The Matrix Reloaded", "Sense8"]);
    expect(response.body.pager.totalCount).toBe(3);
  });

  it("uses the primary search success and never consults secondaries", async () => {
    const spunFetch = vi.fn(async () => {
      throw new Error("spun must not be called");
    });
    const daratechFetch = vi.fn(async () => {
      throw new Error("daratech must not be called");
    });
    const app = createApp({
      providers: registryWithSecondaries(
        failingPrimary({
          fetchSearch: async () => ({
            items: [
              {
                subjectId: "1654274595068805784",
                type: "movie",
                title: "Avatar [Hindi]",
                releaseDate: "2009-12-18",
                duration: "2h 42m",
                genre: "Action",
                poster: null,
                rating: 7.9,
                language: null,
                country: null,
              },
            ],
            pager: { hasMore: false, page: 1, perPage: 20, totalCount: 1 },
          }),
        }),
        spunFetch,
        daratechFetch,
      ),
    });

    const response = await request(app).get("/api/v1/media/search?q=avatar");

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(spunFetch).not.toHaveBeenCalled();
    expect(daratechFetch).not.toHaveBeenCalled();
  });

  it("surfaces the primary failure when every secondary fails too", async () => {
    const spunFetch = vi.fn(async () => {
      throw new TypeError("spun down");
    });
    const daratechFetch = vi.fn(async () => {
      throw new TypeError("daratech down");
    });
    const app = createApp({
      providers: registryWithSecondaries(failingPrimary(), spunFetch, daratechFetch),
    });

    const response = await request(app).get("/api/v1/media/search?q=matrix");

    expect(response.status).toBe(502);
    expect(response.body.error.code).toBe("MEDIA_UPSTREAM_ERROR");
  });
});

describe("multi-provider info fallback", () => {
  it("resolves a MovieBox id through Spün when the primary info fails", async () => {
    const app = createApp({
      providers: registryWithSecondaries(
        failingPrimary(),
        secondaryFetch({
          "/utility/resolve/moviebox?id=6026412232966389904": SPUN_RESOLVE_FIXTURE,
          "/info/spider-man-brand-new-day-824972": SPUN_INFO_FIXTURE,
        }),
        secondaryFetch({}),
      ),
    });

    const response = await request(app).get("/api/v1/media/info/6026412232966389904");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      subjectId: "6026412232966389904",
      type: "movie",
      title: "Spider-Man: Brand New Day",
      backdrop: "https://image.tmdb.org/t/p/w1280/b.jpg",
      // Fallback metadata never implies playability.
      hasResource: false,
    });
    expect(response.body.externalIds).toMatchObject({
      moviebox: "6026412232966389904",
      spun: "spider-man-brand-new-day-824972",
    });
  });

  it("falls back to DaraTech detail by base64-translating the MovieBox id", async () => {
    const app = createApp({
      providers: registryWithSecondaries(
        failingPrimary(),
        secondaryFetch({}),
        secondaryFetch({
          "/detail/NjAyNjQxMjIzMjk2NjM4OTkwNDo6OnBpY2E": {
            id: "NjAyNjQxMjIzMjk2NjM4OTkwNDo6OnBpY2E",
            subjectId: "NjAyNjQxMjIzMjk2NjM4OTkwNDo6OnBpY2E",
            title: "Spider-Man: Brand New Day",
            cover: "https://pbcdn.aoneroom.com/image/x.jpg",
            backdrop: "https://pbcdn.aoneroom.com/image/b.jpg",
            year: 2026,
            rating: 7.9,
            genres: ["Action"],
            description: "The web-slinger returns.",
            subjectType: 1,
            language: "English",
            country: "United States",
            cast: [],
            stills: [],
            related: [],
            trailer: null,
          },
        }),
      ),
    });

    const response = await request(app).get("/api/v1/media/info/6026412232966389904");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      subjectId: "6026412232966389904",
      title: "Spider-Man: Brand New Day",
      hasResource: false,
    });
    expect(response.body.externalIds.daratech).toBe("NjAyNjQxMjIzMjk2NjM4OTkwNDo6OnBpY2E");
  });

  it("surfaces the primary info failure when all secondaries fail", async () => {
    const app = createApp({
      providers: registryWithSecondaries(
        failingPrimary(),
        secondaryFetch({}),
        secondaryFetch({}),
      ),
    });

    const response = await request(app).get("/api/v1/media/info/6026412232966389904");

    expect(response.status).toBe(502);
    expect(response.body.error.code).toBe("MEDIA_UPSTREAM_ERROR");
  });
});

describe("info enrichment (primary succeeds)", () => {
  function enrichedPrimary(): MediaProvider {
    return failingPrimary({
      fetchInfo: async (subjectId: string) => ({
        subjectId,
        type: "movie",
        title: "Spider-Man: Brand New Day",
        description: "The web-slinger returns.",
        releaseDate: null,
        runtime: 132,
        genre: "Action",
        poster: "https://pbcdn.example/poster.jpg",
        backdrop: null,
        country: null,
        rating: 7.9,
        hasResource: true,
        language: "English",
        staff: [],
        externalIds: { moviebox: null, spun: null, daratech: null, imdb: null, tmdb: null },
      }),
    });
  }

  it("fills missing backdrop from Spün without touching primary data or playability", async () => {
    const spunFetch = secondaryFetch({
      "/utility/resolve/moviebox?id=6026412232966389904": SPUN_RESOLVE_FIXTURE,
      "/info/spider-man-brand-new-day-824972": SPUN_INFO_FIXTURE,
    });
    const app = createApp({
      providers: registryWithSecondaries(enrichedPrimary(), spunFetch, secondaryFetch({})),
    });

    const response = await request(app).get("/api/v1/media/info/6026412232966389904");

    expect(response.status).toBe(200);
    expect(response.body.backdrop).toBe("https://image.tmdb.org/t/p/w1280/b.jpg");
    // Primary fields are never overwritten by secondary data...
    expect(response.body.poster).toBe("https://pbcdn.example/poster.jpg");
    expect(response.body.genre).toBe("Action");
    // ...and the primary's playback truth always wins.
    expect(response.body.hasResource).toBe(true);
    expect(response.body.subjectId).toBe("6026412232966389904");
  });

  it("caches the enriched result so repeat views do not re-hit secondaries", async () => {
    const spunFetch = secondaryFetch({
      "/utility/resolve/moviebox?id=6026412232966389904": SPUN_RESOLVE_FIXTURE,
      "/info/spider-man-brand-new-day-824972": SPUN_INFO_FIXTURE,
    });
    const app = createApp({
      providers: registryWithSecondaries(enrichedPrimary(), spunFetch, secondaryFetch({})),
    });

    await request(app).get("/api/v1/media/info/6026412232966389904");
    await request(app).get("/api/v1/media/info/6026412232966389904");

    const spunInfoCalls = spunFetch.mock.calls.filter(([url]) =>
      String(url).includes("/info/spider-man-brand-new-day-824972"),
    );
    expect(spunInfoCalls).toHaveLength(1);
  });

  it("never lets enrichment degrade the primary answer when secondaries fail", async () => {
    const app = createApp({
      providers: registryWithSecondaries(
        enrichedPrimary(),
        secondaryFetch({}),
        secondaryFetch({}),
      ),
    });

    const response = await request(app).get("/api/v1/media/info/6026412232966389904");

    expect(response.status).toBe(200);
    expect(response.body.title).toBe("Spider-Man: Brand New Day");
    expect(response.body.hasResource).toBe(true);
    expect(response.body.backdrop).toBeNull();
  });

  it("keeps metadata success distinct from playback availability", async () => {
    const app = createApp({
      providers: registryWithSecondaries(
        enrichedPrimary(),
        secondaryFetch({
          "/utility/resolve/moviebox?id=6026412232966389904": SPUN_RESOLVE_FIXTURE,
          "/info/spider-man-brand-new-day-824972": SPUN_INFO_FIXTURE,
        }),
        secondaryFetch({}),
      ),
    });

    const response = await request(app).get("/api/v1/media/info/6026412232966389904");

    // Rich metadata exists, but playback truth comes from the primary only.
    expect(response.body.backdrop).not.toBeNull();
    expect(response.body.hasResource).toBe(true);
  });
});