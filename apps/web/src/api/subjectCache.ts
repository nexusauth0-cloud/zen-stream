import type { MediaInfo, MediaSearchItem, MediaSubjectSummary } from "@zen-stream/contracts";
import { getMediaAvailability } from "@zen-stream/contracts";

/**
 * Last-known normalized metadata per subject, kept in memory for the
 * session. Every successful fetch (home feed, home subjects, search,
 * info) records the summaries it saw, so details and watch pages can
 * stay useful — for example rendering the honest Coming Soon state for
 * an upcoming title — even when the live providers are unavailable.
 *
 * The cache is trusted metadata only: entries are written exclusively
 * from successful, schema-validated API responses. Nothing is invented
 * here, and entries never hold a preview URL unless a real one arrived.
 */
const subjects = new Map<string, MediaSubjectSummary>();

export function rememberSubject(item: MediaSubjectSummary): void {
  subjects.set(item.subjectId, item);
}

export function rememberSubjects(items: readonly MediaSubjectSummary[]): void {
  for (const item of items) rememberSubject(item);
}

/** Last-known summary for a subject, if this session ever saw it. */
export function cachedSubject(subjectId: string): MediaSubjectSummary | undefined {
  return subjects.get(subjectId);
}

/**
 * The cached summary for a subject when it is known to be upcoming
 * (future release date), otherwise null. This is the provider-independent
 * signal details and watch pages use instead of a raw provider failure:
 * nothing here invents a date — only schema-validated responses count.
 */
export function knownUpcoming(subjectId: string): MediaSubjectSummary | null {
  const cached = subjects.get(subjectId);
  if (!cached) return null;
  return getMediaAvailability(cached) === "coming-soon" ? cached : null;
}

/** Summary projection of a full info payload (keeps cache consumers uniform). */
export function summaryFromInfo(info: MediaInfo): MediaSubjectSummary {
  return {
    subjectId: info.subjectId,
    type: info.type,
    title: info.title,
    poster: info.poster,
    hasResource: info.hasResource,
    description: info.description,
    releaseDate: info.releaseDate,
    runtime: info.runtime,
    genre: info.genre,
    rating: info.rating,
    language: info.language,
    country: info.country,
  };
}

/**
 * Summary projection of a search hit. Search results do not carry
 * resource/description/runtime fields, so those default honestly:
 * `hasResource` stays false — a search hit alone never implies playback.
 */
export function summaryFromSearchItem(item: MediaSearchItem): MediaSubjectSummary {
  return {
    subjectId: item.subjectId,
    type: item.type,
    title: item.title,
    poster: item.poster,
    hasResource: false,
    description: null,
    releaseDate: item.releaseDate,
    runtime: null,
    genre: item.genre,
    rating: item.rating,
    language: item.language,
    country: item.country,
  };
}

/** Test helper: resets the session cache between cases. */
export function clearSubjectCache(): void {
  subjects.clear();
}

/**
 * Fills a missing release date on an info payload from the session cache.
 * The live info endpoints sometimes omit the release date that the same
 * session already saw on home/search lists; reusing that trusted value
 * lets availability render honestly (e.g. "Coming Aug 28") instead of
 * falling back to the generic "not available" state. A server-provided
 * date always wins; a cached date is only ever a fill-in.
 */
export function infoWithCachedReleaseDate(info: MediaInfo): MediaInfo {
  if (info.releaseDate) return info;
  const cached = subjects.get(info.subjectId);
  if (!cached?.releaseDate) return info;
  return { ...info, releaseDate: cached.releaseDate };
}
