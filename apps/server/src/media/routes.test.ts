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
      country: "United States",
      rating: 7.9,
      hasResource: true,
      language: "English",
      staff: [],
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