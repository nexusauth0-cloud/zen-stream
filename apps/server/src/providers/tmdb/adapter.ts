/**
 * TMDB → Zen-Stream contract adapter.
 *
 * Maps validated TMDB domain data into the canonical contract payloads. The
 * web app never learns that TMDB produced the data, and TMDB never
 * fabricates playback: every info payload from this adapter has
 * `hasResource: false`, so the availability model keeps TMDB-only titles
 * unplayable ("unavailable" or "coming-soon") unless the primary provider
 * proves otherwise.
 *
 * Subject ids are namespaced as `movie:<id>` / `series:<id>` so a TMDB id
 * never collides with a MovieBox subject id and the media type is
 * unambiguous for later lookups.
 */
import { infoResponseSchema, searchResponseSchema } from "@zen-stream/contracts";
import type { MediaInfo, MediaSearchParams, MediaSearchResponse } from "@zen-stream/contracts";
import { UpstreamHttpError } from "../../media/client.js";
import type { TmdBMovieDetails, TmdBSearchPage, TmdBSearchResult, TmdBTvDetails } from "./types.js";
import type { TmdBGenre } from "./types.js";

export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export function tmdbPosterUrl(path: string | null | undefined): string | null {
  return path ? `${TMDB_IMAGE_BASE}/w500${path}` : null;
}

export function tmdbBackdropUrl(path: string | null | undefined): string | null {
  return path ? `${TMDB_IMAGE_BASE}/w1280${path}` : null;
}

/**
 * Parses a namespaced TMDB subject id. Throws a typed not-found error for
 * anything else (a MovieBox id, garbage) so callers can treat it exactly
 * like "this provider does not know this title".
 */
export function parseTmdBSubjectId(subjectId: string): { kind: "movie" | "series"; id: number } {
  const match = /^(movie|series):(\d+)$/.exec(subjectId);
  if (!match) {
    throw new UpstreamHttpError(404, `Unknown TMDB subject id: ${subjectId}`);
  }
  return { kind: match[1] === "movie" ? "movie" : "series", id: Number(match[2]) };
}

export function tmdbSearchItemToRaw(item: TmdBSearchResult, genresById: Map<number, string>) {
  if (item.media_type === "person") return null;
  const type = item.media_type === "tv" ? "series" : "movie";
  return {
    subjectId: `${type}:${item.id}`,
    // 1 = movie, 2 = series in the canonical subject-type mapping
    subjectType: type === "movie" ? 1 : 2,
    title: item.title ?? item.name ?? "Untitled",
    releaseDate: item.release_date ?? item.first_air_date ?? null,
    duration: null,
    genre: item.genre_ids.map((id) => genresById.get(id)).filter((name): name is string => Boolean(name)).join(", ") || null,
    poster: tmdbPosterUrl(item.poster_path),
    rating: typeof item.vote_average === "number" ? Math.round(item.vote_average * 10) / 10 : null,
    language: item.original_language ?? null,
    country: null,
  };
}

export function tmdbMovieToRaw(details: TmdBMovieDetails) {
  return {
    subjectId: `movie:${details.id}`,
    subjectType: 1,
    title: details.title,
    description: details.overview ?? null,
    releaseDate: details.release_date ?? null,
    runtime: details.runtime ?? null,
    genre: details.genres.map((genre) => genre.name).join(", ") || null,
    poster: tmdbPosterUrl(details.poster_path),
    country: details.production_countries[0]?.iso_3166_1 ?? null,
    rating: typeof details.vote_average === "number" ? Math.round(details.vote_average * 10) / 10 : null,
    // TMDB metadata never implies playability.
    hasResource: false,
    language: details.original_language ?? null,
    staff: [],
  };
}

export function tmdbTvToRaw(details: TmdBTvDetails) {
  return {
    subjectId: `series:${details.id}`,
    subjectType: 2,
    title: details.name,
    description: details.overview ?? null,
    releaseDate: details.first_air_date ?? null,
    runtime: details.episode_run_time[0] ?? null,
    genre: details.genres.map((genre) => genre.name).join(", ") || null,
    poster: tmdbPosterUrl(details.poster_path),
    country: details.production_countries[0]?.iso_3166_1 ?? null,
    rating: typeof details.vote_average === "number" ? Math.round(details.vote_average * 10) / 10 : null,
    hasResource: false,
    language: details.original_language ?? null,
    staff: [],
  };
}

export function tmdbSearchToResponse(
  params: MediaSearchParams,
  page: TmdBSearchPage,
  genres: TmdBGenre[],
): MediaSearchResponse {
  const genresById = new Map(genres.map((genre) => [genre.id, genre.name]));
  const rawItems = page.results
    .map((item) => tmdbSearchItemToRaw(item, genresById))
    .filter((item): item is NonNullable<typeof item> => item !== null);
  return searchResponseSchema.parse({
    items: rawItems,
    pager: {
      hasMore: page.page < page.total_pages,
      page: String(page.page),
      perPage: params.perPage,
      totalCount: page.total_results,
    },
  });
}

export function tmdbInfoToResponse(details: TmdBMovieDetails | TmdBTvDetails): MediaInfo {
  const raw = "title" in details ? tmdbMovieToRaw(details) : tmdbTvToRaw(details);
  return infoResponseSchema.parse(raw);
}