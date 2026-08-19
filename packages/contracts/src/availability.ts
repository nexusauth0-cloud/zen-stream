/**
 * Zen-Stream media availability model.
 *
 * Availability is a *derived, first-class* concept: consumers never guess
 * whether a title can be played — they ask {@link getMediaAvailability} and
 * {@link getMediaActions}. Derivation keeps the wire contracts stable while
 * giving every surface (hero, cards, details, search, watch guard) one
 * consistent answer.
 *
 * States:
 *  - "available":     playable now (has a resource, or released already)
 *  - "coming-soon":   future release date — never navigates into playback
 *  - "preview-only":  only a preview exists right now
 *  - "unavailable":   no resource and nothing upcoming
 *
 * Dates are compared at date granularity in UTC so "released today" is
 * available, and date-only strings ("2026-08-28") never drift across
 * timezones.
 */

export type MediaAvailability = "available" | "coming-soon" | "preview-only" | "unavailable";

/** Everything availability decisions need from any media payload. */
export interface MediaAvailabilityInput {
  releaseDate: string | null | undefined;
  hasResource: boolean;
  /** Optional; contracts may not carry one yet — the model stays ready. */
  previewUrl?: string | null | undefined;
}

/** The canonical action set every surface renders from. */
export interface MediaActions {
  watch: boolean;
  preview: boolean;
  save: boolean;
  share: boolean;
  details: boolean;
}

/** Strict ISO date prefix; full timestamps and timezones are tolerated. */
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/;

/**
 * Parses a release date into a UTC midnight Date. Accepts date-only strings
 * and ISO timestamps; returns null for anything missing or malformed.
 */
export function parseMediaReleaseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = ISO_DATE.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

/**
 * Derives the availability state for a media payload.
 *
 * A future release date always wins (even when a resource is listed — a
 * title that has not released yet must not be presented as playable).
 * Otherwise a preview-only item is "preview-only", a resource-backed item
 * is "available", and everything else is "unavailable".
 */
export function getMediaAvailability(
  input: MediaAvailabilityInput,
  now: Date = new Date(),
): MediaAvailability {
  const release = parseMediaReleaseDate(input.releaseDate);
  if (release) {
    const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    if (release.getTime() > today) return "coming-soon";
  }
  if (input.hasResource) return "available";
  if (input.previewUrl) return "preview-only";
  return "unavailable";
}

/**
 * The action set for a payload, derived from its availability.
 *
 *  - available:    watch, save, share, details
 *  - coming-soon:  preview (only when a preview exists), save, share, details — never watch
 *  - preview-only: preview, save, share, details
 *  - unavailable:  preview (when a preview exists), save, share, details
 */
export function getMediaActions(input: MediaAvailabilityInput, now: Date = new Date()): MediaActions {
  const availability = getMediaAvailability(input, now);
  const hasPreview = Boolean(input.previewUrl);
  switch (availability) {
    case "available":
      return { watch: true, preview: false, save: true, share: true, details: true };
    case "coming-soon":
      return { watch: false, preview: hasPreview, save: true, share: true, details: true };
    case "preview-only":
      return { watch: false, preview: true, save: true, share: true, details: true };
    case "unavailable":
      return { watch: false, preview: hasPreview, save: true, share: true, details: true };
  }
}

/** "Aug 28" or (with `year`) "Aug 28, 2026", in UTC so dates never shift. */
export function formatMediaReleaseDate(
  value: string | null | undefined,
  options: { year?: boolean } = {},
): string | null {
  const date = parseMediaReleaseDate(value);
  if (!date) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(options.year ? { year: "numeric" } : {}),
    timeZone: "UTC",
  }).format(date);
}

/** "Coming Aug 28" / "Coming Aug 28, 2026" — null when the date is unknown. */
export function formatComingSoonLabel(
  value: string | null | undefined,
  options: { year?: boolean } = {},
): string | null {
  const formatted = formatMediaReleaseDate(value, options);
  return formatted ? `Coming ${formatted}` : null;
}