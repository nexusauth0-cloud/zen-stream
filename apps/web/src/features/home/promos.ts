import type { MediaHomeFeed } from "@zen-stream/contracts";

export const MAX_PROMOS = 3;

/**
 * Deterministic promo placement for the home rail sequence. Given a seed,
 * the same rail count always yields the same slots — a fresh page load can
 * differ, but the layout never jumps around while the user scrolls.
 *
 * Guarantees:
 *  - never the slot right after the hero (index 0)
 *  - never adjacent promos (at least one rail between them)
 *  - at most {@link MAX_PROMOS} placements, spread across the feed
 */
export function promoSlots(rowCount: number, seed: number, promoCount = MAX_PROMOS): number[] {
  if (rowCount < 3 || promoCount < 1) return [];
  const count = Math.min(promoCount, Math.floor((rowCount - 1) / 2));
  if (count === 0) return [];

  let state = (seed || 0.5) * 0xffffffff;
  const rng = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };

  const span = rowCount - 1;
  const gap = span / (count + 1);
  const slots: number[] = [];
  for (let i = 0; i < count; i += 1) {
    const anchor = (i + 1) * gap;
    const jitter = (rng() - 0.5) * Math.min(gap * 0.8, 1.4);
    let slot = Math.max(1, Math.min(span, Math.round(anchor + jitter)));
    const minSlot = slots.length > 0 ? slots[slots.length - 1]! + 2 : 1;
    if (slot < minSlot) slot = minSlot;
    slots.push(slot);
  }
  return slots;
}

export type HomeFeedEntry =
  | { key: string; row: MediaHomeFeed["rows"][number]; promo?: undefined }
  | { key: string; promo: true; variant: number; row?: undefined };

/** Merges rails and promo placements into the rendered home sequence. */
export function interleavePromos(
  rows: MediaHomeFeed["rows"],
  slots: readonly number[],
): HomeFeedEntry[] {
  const entries: HomeFeedEntry[] = [];
  let promoIndex = 0;
  rows.forEach((row, index) => {
    if (slots.includes(index)) {
      entries.push({ key: `promo-${index}`, promo: true, variant: promoIndex });
      promoIndex += 1;
    }
    entries.push({ key: row.opId, row });
  });
  return entries;
}
