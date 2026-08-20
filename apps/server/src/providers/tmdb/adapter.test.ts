import { describe, expect, it } from "vitest";
import {
  parseTmdBSubjectId,
  tmdbInfoToResponse,
  tmdbPosterUrl,
  tmdbSearchItemToRaw,
  tmdbSearchToResponse,
} from "./adapter.js";
import { UpstreamHttpError } from "../../media/client.js";
import { getMediaAvailability } from "@zen-stream/contracts";
import type { TmdBSearchPage } from "./types.js";

const SEARCH_PAGE: TmdBSearchPage = {
  page: 1,
  total_pages: 1,
  total_results: 2,
  results: [
    { id: 27205, media_type: "movie", title: "Inception", release_date: "2010-07-15", poster_path: "/x.jpg", vote_average: 8.4, genre_ids: [28, 878], original_language: "en" },
    { id: 1396, media_type: "tv", name: "Breaking Bad", first_air_date: "2008-01-20", poster_path: null, vote_average: 9.3, genre_ids: [18], original_language: "en" },
  ],
};

const GENRES = [
  { id: 28, name: "Action" },
  { id: 878, name: "Science Fiction" },
  { id: 18, name: "Drama" },
];

describe("tmdbSearchToResponse", () => {
  it("maps TMDB results into the canonical search contract", () => {
    const response = tmdbSearchToResponse(
      { keyword: "inception", page: 1, perPage: 20 },
      SEARCH_PAGE,
      GENRES,
    );

    expect(response.items).toHaveLength(2);
    expect(response.items[0]).toMatchObject({
      subjectId: "movie:27205",
      type: "movie",
      title: "Inception",
      releaseDate: "2010-07-15",
      genre: "Action, Science Fiction",
      poster: "https://image.tmdb.org/t/p/w500/x.jpg",
      rating: 8.4,
      language: "en",
      country: null,
    });
    expect(response.items[1]).toMatchObject({
      subjectId: "series:1396",
      type: "series",
      title: "Breaking Bad",
      releaseDate: "2008-01-20",
    });
    expect(response.pager).toMatchObject({ hasMore: false, page: 1, totalCount: 2 });
  });

  it("drops person results and unknown genres silently", () => {
    const item = tmdbSearchItemToRaw(
      {
        id: 1,
        media_type: "person",
        title: "Someone",
        genre_ids: [99999],
      } as never,
      new Map<number, string>(),
    );

    expect(item).toBeNull();

    const page = tmdbSearchToResponse(
      { keyword: "someone", page: 1, perPage: 20 },
      { page: 1, total_pages: 1, total_results: 1, results: [SEARCH_PAGE.results[0]!] },
      [],
    );
    expect(page.items[0]?.genre).toBeNull();
  });

  it("propagates TMDB pagination", () => {
    const response = tmdbSearchToResponse(
      { keyword: "x", page: 3, perPage: 20 },
      { page: 3, total_pages: 5, total_results: 94, results: [] },
      [],
    );

    expect(response.pager).toMatchObject({ hasMore: true, page: 3, totalCount: 94 });
  });
});

describe("tmdbInfoToResponse", () => {
  it("maps movie details without ever claiming a resource", () => {
    const info = tmdbInfoToResponse({
      id: 27205,
      title: "Inception",
      overview: "A thief who steals corporate secrets.",
      release_date: "2010-07-15",
      poster_path: "/inception.jpg",
      vote_average: 8.4,
      runtime: 148,
      genres: [{ id: 28, name: "Action" }],
      original_language: "en",
      production_countries: [{ iso_3166_1: "US" }],
      external_ids: { imdb_id: "tt1375666" },
    });

    expect(info).toMatchObject({
      subjectId: "movie:27205",
      type: "movie",
      title: "Inception",
      releaseDate: "2010-07-15",
      runtime: 148,
      genre: "Action",
      poster: "https://image.tmdb.org/t/p/w500/inception.jpg",
      country: "US",
      rating: 8.4,
      hasResource: false,
      staff: [],
    });
  });

  it("maps TV details to the series type", () => {
    const info = tmdbInfoToResponse({
      id: 1396,
      name: "Breaking Bad",
      overview: "A chemistry teacher turns to cooking.",
      first_air_date: "2008-01-20",
      episode_run_time: [47],
      genres: [{ id: 18, name: "Drama" }],
      production_countries: [{ iso_3166_1: "US" }],
      external_ids: { imdb_id: "tt0903747" },
    });

    expect(info).toMatchObject({
      subjectId: "series:1396",
      type: "series",
      title: "Breaking Bad",
      releaseDate: "2008-01-20",
      runtime: 47,
      hasResource: false,
    });
  });
});

describe("tmdb metadata cannot turn content playable", () => {
  it("a released TMDB title normalizes to unavailable, never available", () => {
    const info = tmdbInfoToResponse({
      id: 27205,
      title: "Inception",
      release_date: "2010-07-15",
      genres: [],
      production_countries: [],
    } as never);

    expect(info.hasResource).toBe(false);
    expect(getMediaAvailability(info)).toBe("unavailable");
  });

  it("a future TMDB title normalizes to coming-soon, never watchable", () => {
    const info = tmdbInfoToResponse({
      id: 1396,
      name: "Future Show",
      first_air_date: "2099-01-01",
      episode_run_time: [],
      genres: [],
      production_countries: [],
    } as never);

    expect(info.hasResource).toBe(false);
    expect(getMediaAvailability(info)).toBe("coming-soon");
  });
});

describe("parseTmdBSubjectId", () => {
  it("parses namespaced ids", () => {
    expect(parseTmdBSubjectId("movie:27205")).toEqual({ kind: "movie", id: 27205 });
    expect(parseTmdBSubjectId("series:1396")).toEqual({ kind: "series", id: 1396 });
  });

  it("rejects foreign ids as not-found", () => {
    expect(() => parseTmdBSubjectId("6021098917113354936")).toThrow(UpstreamHttpError);
    expect(() => parseTmdBSubjectId("movie:not-a-number")).toThrow(UpstreamHttpError);
  });
});

describe("tmdbPosterUrl", () => {
  it("builds image URLs and nulls empty paths", () => {
    expect(tmdbPosterUrl("/x.jpg")).toBe("https://image.tmdb.org/t/p/w500/x.jpg");
    expect(tmdbPosterUrl(null)).toBeNull();
    expect(tmdbPosterUrl("")).toBeNull();
  });
});