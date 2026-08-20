/**
 * Spün → Zen-Stream contract adapter.
 *
 * Maps validated Spün domain data into the canonical contract payloads. The
 * web app never learns that Spün produced the data, and Spün never
 * fabricates playback: every info payload from this adapter has
 * `hasResource: false`, so the availability model keeps Spün-only titles
 * unplayable unless the primary provider proves otherwise.
 *
 * Spün exposes only a `year` (no full release dates), so `releaseDate`
 * stays null here — TMDB remains the release-date authority and the
 * availability model never sees an invented date.
 */
import { infoResponseSchema, searchResponseSchema } from "@zen-stream/contracts";
import type { MediaInfo, MediaSearchParams, MediaSearchResponse } from "@zen-stream/contracts";
import type { SpunInfo, SpunSearchItem, SpunSearchPage, SpunSubjectType } from "./types.js";

/** Spün types map onto the canonical subject types: movie → 1, episodic → 2. */
export function spunSubjectTypeNumber(type: SpunSubjectType): number {
  return type === "movie" ? 1 : 2;
}

export function spunSearchItemToRaw(item: SpunSearchItem) {
  return {
    subjectId: item.spun_id,
    subjectType: spunSubjectTypeNumber(item.type),
    title: item.title,
    releaseDate: null,
    duration: null,
    genre: null,
    poster: item.poster,
    rating: item.rating,
    language: null,
    country: null,
  };
}

export function spunSearchToResponse(
  params: MediaSearchParams,
  page: SpunSearchPage,
): MediaSearchResponse {
  const rawItems = page.results.map(spunSearchItemToRaw);
  return searchResponseSchema.parse({
    items: rawItems,
    pager: {
      hasMore: (page.page ?? 1) < (page.total_pages ?? 1),
      page: page.page ?? 1,
      perPage: params.perPage,
      totalCount: page.total_results ?? rawItems.length,
    },
  });
}

/**
 * Maps a validated Spün info payload into the canonical info contract.
 *
 * `subjectId` is the identifier the caller navigated with (the primary
 * provider's id or a Spün id) so deep links stay stable; `externalIds`
 * carries the cross-provider identities the server resolved.
 */
export function spunInfoToResponse(
  requestedSubjectId: string,
  info: SpunInfo,
  externalIds: {
    moviebox: string | null;
    spun: string | null;
    daratech: string | null;
    imdb: string | null;
    tmdb: number | null;
  },
): MediaInfo {
  return infoResponseSchema.parse({
    subjectId: requestedSubjectId,
    subjectType: spunSubjectTypeNumber(info.type),
    title: info.title,
    description: info.overview,
    releaseDate: null,
    runtime: info.runtime,
    genre: info.genres.join(", ") || null,
    poster: info.poster,
    backdrop: info.backdrop,
    country: null,
    rating: info.rating,
    // Spün metadata never implies playability.
    hasResource: false,
    language: null,
    staff: info.cast.map((member) => ({
      name: member.name,
      role: member.character ?? "",
      avatar: member.image,
    })),
    externalIds,
  });
}