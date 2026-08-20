import { afterEach, describe, expect, it, vi } from "vitest";
import { createTmdBClient, resetTmdBGenreCache, TMDB_API_BASE_URL } from "./client.js";
import type { UpstreamFetch } from "../../media/client.js";

const CONFIG = { apiKey: "tmdb-test-key" };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function clientWith(fetchImpl: UpstreamFetch) {
  return createTmdBClient(CONFIG, fetchImpl);
}

describe("createTmdBClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetTmdBGenreCache();
  });

  it("attaches the bearer key to every request", async () => {
    const fetchImpl = vi.fn<UpstreamFetch>(async (url: string, init?: RequestInit) => {
      expect(init?.headers).toMatchObject({ Authorization: "Bearer tmdb-test-key" });
      return jsonResponse({ page: 1, total_pages: 1, total_results: 0, results: [] });
    });

    await clientWith(fetchImpl).searchMulti({ keyword: "inception", page: 1 });

    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining(`${TMDB_API_BASE_URL}/search/multi?`),
      expect.anything(),
    );
  });

  it("searches movies and TV via /search/multi", async () => {
    const fetchImpl = vi.fn<UpstreamFetch>(async () =>
      jsonResponse({
        page: 1,
        total_pages: 2,
        total_results: 31,
        results: [
          { id: 27205, media_type: "movie", title: "Inception", release_date: "2010-07-15", poster_path: "/x.jpg", vote_average: 8.4, genre_ids: [28], original_language: "en" },
          { id: 1234, media_type: "tv", name: "Inception: The Series", first_air_date: "2026-01-01" },
        ],
      }),
    );

    const page = await clientWith(fetchImpl).searchMulti({ keyword: "inception", page: 1 });

    expect(page.results).toHaveLength(2);
    expect(page.results[0]).toMatchObject({ media_type: "movie", title: "Inception" });
    expect(page.results[1]).toMatchObject({ media_type: "tv", name: "Inception: The Series" });
    expect(page.total_pages).toBe(2);
  });

  it("fetches movie details with external ids", async () => {
    const fetchImpl = vi.fn<UpstreamFetch>(async () =>
      jsonResponse({
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
      }),
    );

    const details = await clientWith(fetchImpl).fetchMovie(27205);

    expect(details).toMatchObject({ id: 27205, title: "Inception", external_ids: { imdb_id: "tt1375666" } });
    expect(String(fetchImpl.mock.calls[0]?.[0])).toContain("/movie/27205?");
  });

  it("fetches TV details with external ids", async () => {
    const fetchImpl = vi.fn<UpstreamFetch>(async () =>
      jsonResponse({
        id: 1396,
        name: "Breaking Bad",
        overview: "A chemistry teacher turns to cooking.",
        first_air_date: "2008-01-20",
        episode_run_time: [47],
        genres: [{ id: 18, name: "Drama" }],
        external_ids: { imdb_id: "tt0903747", tvdb_id: 81189 },
      }),
    );

    const details = await clientWith(fetchImpl).fetchTv(1396);

    expect(details).toMatchObject({ id: 1396, name: "Breaking Bad", external_ids: { tvdb_id: 81189 } });
    expect(String(fetchImpl.mock.calls[0]?.[0])).toContain("/tv/1396?");
  });

  it("caches genre lists for an hour", async () => {
    const fetchImpl = vi.fn<UpstreamFetch>(async () => jsonResponse({ genres: [{ id: 28, name: "Action" }] }));

    const client = clientWith(fetchImpl);
    await client.fetchGenres("movie");
    await client.fetchGenres("movie");

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it.each([
    [401, "rejects a bad key"],
    [403, "rejects a forbidden key"],
  ] as const)("maps TMDB %s to a typed upstream error", async (status, _label) => {
    const fetchImpl = vi.fn<UpstreamFetch>(async () => jsonResponse({ status_message: "nope" }, status));

    await expect(clientWith(fetchImpl).searchMulti({ keyword: "x", page: 1 })).rejects.toMatchObject({
      name: "UpstreamHttpError",
      status,
    });
  });

  it("maps TMDB 429 rate limiting to a typed upstream error", async () => {
    const fetchImpl = vi.fn<UpstreamFetch>(async () =>
      jsonResponse({ status_message: "Too many requests" }, 429),
    );

    await expect(clientWith(fetchImpl).fetchMovie(1)).rejects.toMatchObject({
      name: "UpstreamHttpError",
      status: 429,
    });
  });

  it("maps TMDB 5xx responses to a typed upstream error", async () => {
    const fetchImpl = vi.fn<UpstreamFetch>(async () => jsonResponse({ error: "boom" }, 503));

    await expect(clientWith(fetchImpl).fetchMovie(1)).rejects.toMatchObject({
      name: "UpstreamHttpError",
      status: 503,
    });
  });

  it("maps network failures to a typed 502 upstream error", async () => {
    const fetchImpl = vi.fn<UpstreamFetch>(async () => {
      throw new TypeError("fetch failed");
    });

    await expect(clientWith(fetchImpl).searchMulti({ keyword: "x", page: 1 })).rejects.toMatchObject({
      name: "UpstreamHttpError",
      status: 502,
    });
  });

  it("rejects malformed TMDB payloads", async () => {
    const fetchImpl = vi.fn<UpstreamFetch>(async () => jsonResponse({ results: "not-an-array" }));

    await expect(clientWith(fetchImpl).searchMulti({ keyword: "x", page: 1 })).rejects.toThrow();
  });
});