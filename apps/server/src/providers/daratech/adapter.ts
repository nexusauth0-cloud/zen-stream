/**
 * DaraTech → Zen-Stream contract adapter.
 *
 * Maps validated DaraTech domain data into the canonical contract payloads.
 * DaraTech is metadata/discovery-only in Zen-Stream: every info payload
 * from this adapter has `hasResource: false`, so the availability model
 * never treats a DaraTech title as playable. DaraTech exposes only a
 * `year`, so `releaseDate` stays null — TMDB remains the release-date
 * authority and no invented date ever reaches the model.
 *
 * DaraTech ids are base64 of the underlying MovieBox/Pica numeric resource
 * id (`<id>::pica`), so MovieBox ↔ DaraTech identity mapping is
 * deterministic arithmetic (see `identity.ts`).
 */
import { infoResponseSchema, searchResponseSchema } from "@zen-stream/contracts";
import type { MediaInfo, MediaSearchParams, MediaSearchResponse } from "@zen-stream/contracts";
import type { DaratechDetail, DaratechSearchItem, DaratechSearchResponse } from "./types.js";

export function daratechSearchItemToRaw(item: DaratechSearchItem) {
  return {
    subjectId: item.subjectId || item.id,
    subjectType: item.subjectType,
    title: item.title,
    releaseDate: null,
    duration: item.duration,
    genre: item.genres.join(", ") || null,
    poster: item.cover,
    rating: item.rating,
    language: item.language,
    country: item.country,
  };
}

export function daratechSearchToResponse(
  params: MediaSearchParams,
  page: DaratechSearchResponse,
): MediaSearchResponse {
  const rawItems = page.items.map(daratechSearchItemToRaw);
  return searchResponseSchema.parse({
    items: rawItems,
    pager: {
      hasMore: false,
      page: params.page,
      perPage: params.perPage,
      totalCount: rawItems.length,
    },
  });
}

/**
 * Maps a validated DaraTech detail payload into the canonical info
 * contract. `subjectId` is the identifier the caller navigated with so
 * deep links stay stable; `externalIds` carries the resolved
 * cross-provider identities.
 */
export function daratechDetailToInfo(
  requestedSubjectId: string,
  detail: DaratechDetail,
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
    subjectType: detail.subjectType,
    title: detail.title,
    description: detail.description,
    releaseDate: null,
    runtime: null,
    genre: detail.genres.join(", ") || null,
    poster: detail.cover,
    backdrop: detail.backdrop,
    country: detail.country,
    rating: detail.rating,
    // DaraTech metadata never implies playability in Zen-Stream.
    hasResource: false,
    language: detail.language,
    staff: detail.cast.map((member) => ({
      name: member.name,
      role: member.role ?? "",
      avatar: member.photo,
    })),
    externalIds,
  });
}