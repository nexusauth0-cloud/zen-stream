/**
 * Conservative title matching + search-result deduplication.
 *
 * Matching follows the deterministic-ID preference order (provider ID →
 * MovieBox ID → TMDB → IMDb → title+year+type) and never merges records on
 * low-confidence title similarity alone. These helpers are used only where
 * no deterministic identity exists (merging multiple secondary search
 * results), and they only *remove exact duplicate titles* — they never
 * synthesize an identity for a record.
 */
import type { MediaSearchItem } from "@zen-stream/contracts";

/**
 * Normalizes a title for comparison: lowercases, strips bracketed release
 * tags ("[Hindi]", "[CAM]"), collapses whitespace/punctuation.
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/** The deduplication key for a search item when no external id is known. */
export function searchItemDedupKey(item: MediaSearchItem): string {
  return `${item.type}:${normalizeTitle(item.title)}`;
}

/**
 * Removes exact duplicates from a merged result set. Two items are
 * duplicates when they share a deterministic identity key (a numeric
 * MovieBox id derivable from a DaraTech id, or the same normalized
 * title+type). The first occurrence wins; genuinely different titles are
 * never merged.
 */
export function dedupeSearchItems(items: MediaSearchItem[]): MediaSearchItem[] {
  const seen = new Set<string>();
  const unique: MediaSearchItem[] = [];

  for (const item of items) {
    const key = searchItemDedupKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  return unique;
}