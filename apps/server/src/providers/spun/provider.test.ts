import { describe, expect, it, vi } from "vitest";
import { createSpunProvider } from "./provider.js";
import type { UpstreamFetch } from "../../media/client.js";

const CONFIG = { baseUrl: "https://media.byspun.xyz/v1" };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function spunFetch(fixtures: Record<string, unknown>): UpstreamFetch {
  return vi.fn<UpstreamFetch>(async (url: string) => {
    for (const [suffix, body] of Object.entries(fixtures)) {
      if (url.includes(suffix)) return jsonResponse(body);
    }
    throw new Error(`unexpected spun url ${url}`);
  });
}

const SEARCH_FIXTURE = {
  page: 1,
  total_pages: 1,
  total_results: 1,
  results: [
    {
      spun_id: "the-matrix-387273",
      type: "movie",
      title: "The Matrix",
      year: 1999,
      rating: 8.3,
      poster: "https://image.tmdb.org/t/p/w342/x.jpg",
    },
  ],
};

const INFO_FIXTURE = {
  spun_id: "fight-club-828920",
  type: "movie",
  title: "Fight Club",
  year: 1999,
  rating: 8.4,
  overview: "A ticking-time-bomb insomniac.",
  status: "Released",
  runtime: 139,
  genres: ["drama", "thriller"],
  poster: "https://image.tmdb.org/t/p/w500/p.jpg",
  backdrop: "https://image.tmdb.org/t/p/w1280/b.jpg",
  cast: [{ name: "Edward Norton", character: "Narrator", image: "https://img/x.jpg" }],
};

const RESOLVE_FIXTURE = {
  spun_id: "spider-man-brand-new-day-824972",
  type: "movie",
  title: "Spider-Man: Brand New Day",
  year: 2026,
  rating: 7.9,
  poster: null,
};

describe("createSpunProvider", () => {
  it("exposes Spün through the secondary metadata provider interface", async () => {
    const provider = createSpunProvider(CONFIG, spunFetch({ "/search?": SEARCH_FIXTURE }));

    expect(provider.id).toBe("spun");
    expect(provider.name).toBe("Spün");

    const response = await provider.fetchSearch({ keyword: "matrix", page: 1, perPage: 20 });
    expect(response.items[0]).toMatchObject({
      subjectId: "the-matrix-387273",
      type: "movie",
      title: "The Matrix",
      rating: 8.3,
      releaseDate: null,
    });
    expect(response.pager.totalCount).toBe(1);
  });

  it("fetches info directly for a Spün id", async () => {
    const provider = createSpunProvider(CONFIG, spunFetch({ "/info/fight-club-828920": INFO_FIXTURE }));

    const info = await provider.fetchInfo("fight-club-828920");

    expect(info).toMatchObject({
      subjectId: "fight-club-828920",
      type: "movie",
      title: "Fight Club",
      backdrop: "https://image.tmdb.org/t/p/w1280/b.jpg",
      hasResource: false,
      genre: "drama, thriller",
    });
    expect(info.externalIds).toMatchObject({ spun: "fight-club-828920", moviebox: null });
    expect(info.staff[0]).toMatchObject({ name: "Edward Norton", role: "Narrator" });
  });

  it("resolves a MovieBox numeric id through the moviebox namespace", async () => {
    const fetchImpl = spunFetch({
      "/utility/resolve/moviebox?id=6026412232966389904": RESOLVE_FIXTURE,
      "/info/spider-man-brand-new-day-824972": {
        ...INFO_FIXTURE,
        spun_id: "spider-man-brand-new-day-824972",
        title: "Spider-Man: Brand New Day",
      },
    });
    const provider = createSpunProvider(CONFIG, fetchImpl);

    const info = await provider.fetchInfo("6026412232966389904");

    expect(info.subjectId).toBe("6026412232966389904");
    expect(info.title).toBe("Spider-Man: Brand New Day");
    // Cross-provider identities are attached, playback stays false.
    expect(info.externalIds).toMatchObject({
      moviebox: "6026412232966389904",
      spun: "spider-man-brand-new-day-824972",
      daratech: "NjAyNjQxMjIzMjk2NjM4OTkwNDo6OnBpY2E",
    });
    expect(info.hasResource).toBe(false);
  });

  it("treats unresolvable MovieBox ids as not found", async () => {
    const fetchImpl = vi.fn<UpstreamFetch>(async () => jsonResponse({ error: "unknown" }, 404));
    const provider = createSpunProvider(CONFIG, fetchImpl);

    await expect(provider.fetchInfo("999999999")).rejects.toMatchObject({ status: 404 });
  });

  it("treats foreign subject ids as not found", async () => {
    const provider = createSpunProvider(CONFIG, spunFetch({}));

    await expect(provider.fetchInfo("movie:27205")).rejects.toMatchObject({ status: 404 });
  });

  it("reports healthy when the health endpoint answers ok", async () => {
    const provider = createSpunProvider(CONFIG, spunFetch({ "/utility/health": { status: "ok" } }));

    expect(await provider.health!()).toBe("healthy");
  });

  it("reports offline when the health endpoint fails", async () => {
    const fetchImpl = vi.fn<UpstreamFetch>(async () => {
      throw new TypeError("fetch failed");
    });
    const provider = createSpunProvider(CONFIG, fetchImpl);

    expect(await provider.health!()).toBe("offline");
  });
});