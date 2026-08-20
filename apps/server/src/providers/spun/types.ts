/**
 * Spün Media raw API types + validation schemas.
 *
 * These describe the subset of the Spün public API Zen-Stream consumes
 * (search, info, /utility/resolve, health). Raw payloads are validated here
 * before the adapter normalizes them into the canonical Zen-Stream contract
 * shapes — malformed upstream data surfaces as a typed upstream error
 * instead of leaking into routes.
 */
import { z } from "zod";

export const spunSubjectTypeSchema = z.enum(["movie", "tv", "anime"]);
export type SpunSubjectType = z.infer<typeof spunSubjectTypeSchema>;

const nullableNumber = z
  .union([z.number(), z.string().regex(/^-?\d+(\.\d+)?$/)])
  .nullish()
  .transform((value) => (value === null || value === undefined || value === "" ? null : Number(value)));

const nullableString = z
  .string()
  .nullish()
  .transform((value) => value ?? null);

export const spunSearchItemSchema = z.object({
  spun_id: z.string().min(1),
  type: spunSubjectTypeSchema,
  title: z.string(),
  year: nullableNumber,
  rating: nullableNumber,
  poster: nullableString,
});
export type SpunSearchItem = z.infer<typeof spunSearchItemSchema>;

export const spunSearchPageSchema = z.object({
  page: z.number().nullish(),
  total_pages: z.number().nullish(),
  total_results: z.number().nullish(),
  results: z.array(spunSearchItemSchema).default([]),
});
export type SpunSearchPage = z.infer<typeof spunSearchPageSchema>;

const spunCastMemberSchema = z.object({
  name: z.string(),
  character: nullableString,
  image: nullableString,
});

export const spunInfoSchema = z.object({
  spun_id: z.string().min(1),
  type: spunSubjectTypeSchema,
  title: z.string(),
  year: nullableNumber,
  rating: nullableNumber,
  overview: nullableString,
  status: nullableString,
  tagline: nullableString,
  runtime: nullableNumber,
  genres: z.array(z.string()).default([]),
  poster: nullableString,
  backdrop: nullableString,
  studios: z.array(z.string()).default([]),
  cast: z.array(spunCastMemberSchema).default([]),
  stills: z.array(z.string()).default([]),
  trailers: z
    .array(z.object({ key: z.string().nullish(), site: z.string().nullish() }))
    .default([]),
});
export type SpunInfo = z.infer<typeof spunInfoSchema>;

export const spunResolveNamespaceSchema = z.enum(["moviebox", "tmdb", "imdb", "tvdb", "anilist", "mal", "kitsu"]);
export type SpunResolveNamespace = z.infer<typeof spunResolveNamespaceSchema>;

export const spunResolveResultSchema = z.object({
  spun_id: z.string().min(1),
  type: spunSubjectTypeSchema,
  title: z.string(),
  year: nullableNumber,
  rating: nullableNumber,
  poster: nullableString,
});
export type SpunResolveResult = z.infer<typeof spunResolveResultSchema>;

export const spunHealthSchema = z
  .object({
    status: z.string(),
    services: z.record(z.string(), z.string()).nullish(),
  })
  .nullish()
  .transform((value) => ({
    status: value?.status ?? "",
    services: value?.services ?? {},
  }));