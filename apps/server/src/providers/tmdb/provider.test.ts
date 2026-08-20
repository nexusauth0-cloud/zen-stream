import { afterEach, describe, expect, it, vi } from "vitest";
import { createTmdBProvider } from "./provider.js";
import { resetTmdBGenreCache } from "./client.js";
import type { UpstreamFetch } from "../../media/client.js";

const CONFIG = { apiKey: "tmdb-test-key" };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function tmdbFetch(fixtures: Record<string, unknown>): UpstreamFetch {
  return vi.fn<UpstreamFetch>(async (url: string) => {
    for (const [suffix, body] of Object.entries(fixtures)) {
      if (url.includes(suffix)) return jsonResponse(body);
    }
    throw new Error(`unexpected tmdb url ${url}`);
  });
}

const MOVIE_RESULT = {
  id: 27205,
  media_type: "movie",
  title: "Inception",
  release_date: "2010-07-15",
  poster_path: "/x.jpg",
  vote_average: 8.4,
  genre_ids: [28],
  original_language: "en",
};

describe("createTmdBProvider", () => {
  afterEach(() => {
    resetTmdBGenreCache();
  });

  it("exposes TMDB through the secondary metadata provider interface", async () => {
    const provider = createTmdBProvider(
      CONFIG,
      tmdbFetch({
        "/search/multi": { page: 1, total_pages: 1, total_results: 1, results: [MOVIE_RESULT] },
        "/genre/movie/list": { genres: [{ id: 28, name: "Action" }] },
        "/genre/tv/list": { genres: [] },
      }),
    );

    expect(provider.id).toBe("tmdb");
    expect(provider.name).toBe("TMDB");

    const response = await provider.fetchSearch({ keyword: "inception", page: 1, perPage: 20 });
    expect(response.items[0]).toMatchObject({
      subjectId: "movie:27205",
      type: "movie",
      title: "Inception",
      genre: "Action",
    });
  });

  it("resolves movie and series info by namespaced id", async () => {
    const provider = createTmdBProvider(
      CONFIG,
      tmdbFetch({
        "/movie/27205?": {
          id: 27205,
          title: "Inception",
          release_date: "2010-07-15",
          genres: [{ id: 28, name: "Action" }],
          production_countries: [{ iso_3166_1: "US" }],
          external_ids: { imdb_id: "tt1375666" },
        },
        "/tv/1396?": {
          id: 1396,
          name: "Breaking Bad",
          first_air_date: "2008-01-20",
          episode_run_time: [47],
          genres: [{ id: 18, name: "Drama" }],
          external_ids: { imdb_id: "tt0903747" },
        },
      }),
    );

    const movie = await provider.fetchInfo("movie:27205");
    expect(movie).toMatchObject({ type: "movie", title: "Inception", hasResource: false });

    const series = await provider.fetchInfo("series:1396");
    expect(series).toMatchObject({ type: "series", title: "Breaking Bad", hasResource: false });
  });

  it("treats foreign subject ids as not found", async () => {
    const provider = createTmdBProvider(CONFIG, tmdbFetch({}));

    await expect(provider.fetchInfo("6021098917113354936")).rejects.toMatchObject({ status: 404 });
  });
});