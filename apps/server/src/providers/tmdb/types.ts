/**
 * TMDB raw API types + validation schemas.
 *
 * These describe the subset of the TMDB v3 API Zen-Stream consumes
 * (search/multi, movie details, TV details, genre lists). Raw snake_case
 * payloads are validated here before the adapter normalizes them into the
 * canonical Zen-Stream contract shapes — malformed upstream data surfaces
 * as a typed upstream error instead of leaking into routes.
 */
import { z } from "zod";

export const tmdbGenreSchema = z.object({
  id: z.number(),
  name: z.string(),
});
export type TmdBGenre = z.infer<typeof tmdbGenreSchema>;

export const tmdbSearchResultSchema = z.object({
  id: z.number().int().positive(),
  media_type: z.enum(["movie", "tv", "person"]),
  title: z.string().nullish(),
  name: z.string().nullish(),
  release_date: z.string().nullish(),
  first_air_date: z.string().nullish(),
  poster_path: z.string().nullish(),
  backdrop_path: z.string().nullish(),
  overview: z.string().nullish(),
  vote_average: z.number().nullish(),
  genre_ids: z.array(z.number()).default([]),
  original_language: z.string().nullish(),
});
export type TmdBSearchResult = z.infer<typeof tmdbSearchResultSchema>;

export const tmdbSearchPageSchema = z.object({
  page: z.number(),
  total_pages: z.number(),
  total_results: z.number(),
  results: z.array(tmdbSearchResultSchema).default([]),
});
export type TmdBSearchPage = z.infer<typeof tmdbSearchPageSchema>;

const externalIdsSchema = z.object({
  imdb_id: z.string().nullish(),
  tvdb_id: z.number().nullish(),
});

export const tmdbMovieDetailsSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  overview: z.string().nullish(),
  release_date: z.string().nullish(),
  poster_path: z.string().nullish(),
  backdrop_path: z.string().nullish(),
  vote_average: z.number().nullish(),
  runtime: z.number().nullish(),
  genres: z.array(tmdbGenreSchema).default([]),
  original_language: z.string().nullish(),
  production_countries: z.array(z.object({ iso_3166_1: z.string().nullish() })).default([]),
  external_ids: externalIdsSchema.default({}),
});
export type TmdBMovieDetails = z.infer<typeof tmdbMovieDetailsSchema>;

export const tmdbTvDetailsSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  overview: z.string().nullish(),
  first_air_date: z.string().nullish(),
  poster_path: z.string().nullish(),
  backdrop_path: z.string().nullish(),
  vote_average: z.number().nullish(),
  episode_run_time: z.array(z.number()).default([]),
  genres: z.array(tmdbGenreSchema).default([]),
  original_language: z.string().nullish(),
  production_countries: z.array(z.object({ iso_3166_1: z.string().nullish() })).default([]),
  external_ids: externalIdsSchema.default({}),
});
export type TmdBTvDetails = z.infer<typeof tmdbTvDetailsSchema>;

export const tmdbGenreListSchema = z.object({
  genres: z.array(tmdbGenreSchema).default([]),
});
