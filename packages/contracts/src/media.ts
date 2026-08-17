import { z } from "zod";

/**
 * Zen-Stream media contracts.
 *
 * These schemas describe the normalized catalog payloads the server proxy
 * exposes to the web app. The proxy is responsible for fetching from the
 * configured upstream media API, validating the raw upstream response here,
 * and emitting this canonical shape — the web client never sees upstream
 * internals or credentials.
 *
 * The upstream contract follows the patterns documented by the reference
 * MovieBox-compatible API (subject identifiers, subject types, poster
 * artwork, seasons/episodes, per-quality streams), but this is an
 * independent definition owned by Zen-Stream.
 */

export const mediaTypeSchema = z.enum(["movie", "series", "shorts"]);
export type MediaType = z.infer<typeof mediaTypeSchema>;

/** Maps upstream subject types to the canonical Zen-Stream media type. */
export function mediaTypeFromSubjectType(subjectType: number | null | undefined): MediaType {
  if (subjectType === 1) return "movie";
  if (subjectType === 2) return "series";
  return "shorts";
}

const nullableString = z
  .string()
  .nullish()
  .transform((value) => value ?? null);

/** Accepts a number or a numeric string (defensive against upstream drift). */
const nullableNumber = z
  .union([z.number(), z.string().regex(/^-?\d+(\.\d+)?$/)])
  .nullish()
  .transform((value) => (value === null || value === undefined || value === "" ? null : Number(value)));

const nullableBoolean = z
  .boolean()
  .nullish()
  .transform((value) => value ?? false);

/* ── Subjects ─────────────────────────────────────────────────────────── */

const rawSubjectSummarySchema = z.object({
  subjectId: z.string().min(1),
  subjectType: z.number().nullish(),
  title: z.string(),
  poster: nullableString,
  hasResource: nullableBoolean,
  description: nullableString,
  releaseDate: nullableString,
  runtime: nullableNumber,
  genre: nullableString,
  rating: nullableNumber,
  language: nullableString,
  country: nullableString,
});

export const subjectSummarySchema = rawSubjectSummarySchema.transform((raw) => ({
  subjectId: raw.subjectId,
  type: mediaTypeFromSubjectType(raw.subjectType),
  title: raw.title,
  poster: raw.poster,
  hasResource: raw.hasResource,
  description: raw.description,
  releaseDate: raw.releaseDate,
  runtime: raw.runtime,
  genre: raw.genre,
  rating: raw.rating,
  language: raw.language,
  country: raw.country,
}));

export type MediaSubjectSummary = z.infer<typeof subjectSummarySchema>;

/* ── Home feed ────────────────────────────────────────────────────────── */

const rawHomeFeedRowSchema = z.object({
  title: z.string(),
  opId: z.string().min(1),
  type: z.string().nullish(),
  total: z.number().nullish(),
  subjects: z.array(rawSubjectSummarySchema).default([]),
});

const rawHomeFeedSchema = z.object({
  total: z.number().nullish(),
  rows: z.array(rawHomeFeedRowSchema).default([]),
});

export const homeFeedSchema = rawHomeFeedSchema.transform((raw) => ({
  total: raw.total ?? raw.rows.length,
  rows: raw.rows.map((row) => ({
    title: row.title,
    opId: row.opId,
    type: row.type ?? null,
    total: row.total ?? row.subjects.length,
    subjects: row.subjects.map((subject) => subjectSummarySchema.parse(subject)),
  })),
}));

export type MediaHomeRow = z.infer<typeof homeFeedSchema>["rows"][number];
export type MediaHomeFeed = z.infer<typeof homeFeedSchema>;

export const homeRowsSchema = z
  .object({
    total: z.number().nullish(),
    rows: z
      .array(
        z.object({
          title: z.string(),
          opId: z.string().min(1),
        }),
      )
      .default([]),
  })
  .transform((raw) => ({
    total: raw.total ?? raw.rows.length,
    rows: raw.rows,
  }));

export type MediaHomeRows = z.infer<typeof homeRowsSchema>;

export const homeSubjectsSchema = z
  .object({
    opId: z.string().min(1),
    title: z.string().nullish(),
    total: z.number().nullish(),
    subjects: z.array(rawSubjectSummarySchema).default([]),
  })
  .transform((raw) => ({
    opId: raw.opId,
    title: raw.title ?? "Browse",
    total: raw.total ?? raw.subjects.length,
    subjects: raw.subjects.map((subject) => subjectSummarySchema.parse(subject)),
  }));

export type MediaHomeSubjects = z.infer<typeof homeSubjectsSchema>;

/* ── Search ───────────────────────────────────────────────────────────── */

export const mediaSearchParamsSchema = z.object({
  keyword: z.string().trim().min(1).max(120),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(50).default(20),
});
export type MediaSearchParams = z.infer<typeof mediaSearchParamsSchema>;

const rawSearchItemSchema = z.object({
  subjectId: z.string().min(1),
  subjectType: z.number().nullish(),
  title: z.string(),
  releaseDate: nullableString,
  duration: nullableString,
  genre: nullableString,
  poster: nullableString,
  rating: nullableNumber,
  language: nullableString,
  country: nullableString,
});

export const searchResponseSchema = z
  .object({
    items: z.array(rawSearchItemSchema).default([]),
    pager: z
      .object({
        hasMore: z.boolean().nullish(),
        page: z.union([z.string(), z.number()]).nullish(),
        perPage: z.number().nullish(),
        totalCount: z.number().nullish(),
      })
      .nullish()
      .transform((value) => value ?? {}),
  })
  .transform((raw) => ({
    items: raw.items.map((item) => ({
      subjectId: item.subjectId,
      type: mediaTypeFromSubjectType(item.subjectType),
      title: item.title,
      releaseDate: item.releaseDate,
      duration: item.duration,
      genre: item.genre,
      poster: item.poster,
      rating: item.rating,
      language: item.language,
      country: item.country,
    })),
    pager: {
      hasMore: raw.pager.hasMore ?? false,
      page: raw.pager.page === null || raw.pager.page === undefined ? 1 : Number(raw.pager.page),
      perPage: raw.pager.perPage ?? (raw.items.length || 20),
      totalCount: raw.pager.totalCount ?? raw.items.length,
    },
  }));

export type MediaSearchItem = z.infer<typeof searchResponseSchema>["items"][number];
export type MediaSearchResponse = z.infer<typeof searchResponseSchema>;

/* ── Info (movie / series details) ────────────────────────────────────── */

const staffMemberSchema = z.object({
  name: z.string().nullish().transform((value) => value ?? ""),
  role: z.string().nullish().transform((value) => value ?? ""),
  avatar: nullableString,
});

const rawInfoSchema = z.object({
  subjectId: z.string().min(1),
  subjectType: z.number().nullish(),
  title: z.string(),
  description: nullableString,
  releaseDate: nullableString,
  runtime: nullableNumber,
  genre: nullableString,
  poster: nullableString,
  country: nullableString,
  rating: nullableNumber,
  hasResource: nullableBoolean,
  language: nullableString,
  staff: z.array(staffMemberSchema).nullish().transform((value) => value ?? []),
});

export const infoResponseSchema = rawInfoSchema.transform((raw) => ({
  subjectId: raw.subjectId,
  type: mediaTypeFromSubjectType(raw.subjectType),
  title: raw.title,
  description: raw.description,
  releaseDate: raw.releaseDate,
  runtime: raw.runtime,
  genre: raw.genre,
  poster: raw.poster,
  country: raw.country,
  rating: raw.rating,
  hasResource: raw.hasResource,
  language: raw.language,
  staff: raw.staff,
}));

export type MediaStaffMember = z.infer<typeof infoResponseSchema>["staff"][number];
export type MediaInfo = z.infer<typeof infoResponseSchema>;

/* ── Seasons / episodes ───────────────────────────────────────────────── */

const episodeSchema = z.object({
  episode: z.number().int().positive(),
  title: nullableString,
  releaseDate: nullableString,
});

const resolutionTierSchema = z.object({
  resolution: z.number().int().positive(),
  epNum: z.number().int().nonnegative().nullish().transform((value) => value ?? 0),
});

const rawSeasonSchema = z.object({
  season: z.number().int().positive(),
  totalEpisode: z.number().int().nonnegative().nullish().transform((value) => value ?? 0),
  episodesAvailable: z.number().int().nonnegative().nullish().transform((value) => value ?? 0),
  resolutions: z.array(resolutionTierSchema).nullish().transform((value) => value ?? []),
  episodes: z.array(episodeSchema).nullish().transform((value) => value ?? []),
});

export const seasonResponseSchema = z
  .object({
    seasons: z.array(rawSeasonSchema).nullish().transform((value) => value ?? []),
  })
  .transform((raw) => ({ seasons: raw.seasons }));

export type MediaEpisode = z.infer<typeof seasonResponseSchema>["seasons"][number]["episodes"][number];
export type MediaResolutionTier = z.infer<typeof seasonResponseSchema>["seasons"][number]["resolutions"][number];
export type MediaSeason = z.infer<typeof seasonResponseSchema>["seasons"][number];
export type MediaSeasonResponse = z.infer<typeof seasonResponseSchema>;

/* ── Streams (playback) ───────────────────────────────────────────────── */

export const mediaStreamParamsSchema = z.object({
  subjectId: z.string().min(1),
  se: z.coerce.number().int().min(0).default(0),
  ep: z.coerce.number().int().min(0).default(0),
});
export type MediaStreamParams = z.infer<typeof mediaStreamParamsSchema>;

const captionSchema = z.object({
  language: z.string().nullish().transform((value) => value ?? ""),
  language_code: z.string().nullish().transform((value) => value ?? ""),
  url: z.string().nullish().transform((value) => value ?? ""),
});

const streamSchema = z.object({
  quality: z.string(),
  resolution: z.number().int().positive(),
  url: z.string().url(),
  format: z.string().nullish().transform((value) => value ?? "mp4"),
  size: nullableString,
  codecName: nullableString,
  duration: nullableNumber,
  captions: z.array(captionSchema).nullish().transform((value) => value ?? []),
  se: z.number().int().nullish().transform((value) => value ?? 0),
  ep: z.number().int().nullish().transform((value) => value ?? 0),
});

export const streamResponseSchema = z
  .object({
    streams: z.array(streamSchema).nullish().transform((value) => value ?? []),
    total: z.number().int().nullish().transform((value) => value ?? 0),
  })
  .transform((raw) => ({
    streams: raw.streams,
    total: raw.total === 0 ? raw.streams.length : raw.total,
  }));

export type MediaStream = z.infer<typeof streamResponseSchema>["streams"][number];
export type MediaStreamResponse = z.infer<typeof streamResponseSchema>;

/* ── Shared guards ────────────────────────────────────────────────────── */

export function isMediaHomeFeed(value: unknown): value is MediaHomeFeed {
  return homeFeedSchema.safeParse(value).success;
}

export function isMediaSearchResponse(value: unknown): value is MediaSearchResponse {
  return searchResponseSchema.safeParse(value).success;
}

export function isMediaInfo(value: unknown): value is MediaInfo {
  return infoResponseSchema.safeParse(value).success;
}

export function isMediaSeasonResponse(value: unknown): value is MediaSeasonResponse {
  return seasonResponseSchema.safeParse(value).success;
}

export function isMediaStreamResponse(value: unknown): value is MediaStreamResponse {
  return streamResponseSchema.safeParse(value).success;
}