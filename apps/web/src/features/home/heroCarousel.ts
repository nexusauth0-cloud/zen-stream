import type { MediaHomeFeed, MediaSubjectSummary } from "@zen-stream/contracts";

/** Maximum featured titles in the hero rotation. */
export const HERO_TITLE_LIMIT = 10;

/**
 * Eligible featured subjects: real titles with essential artwork and an
 * available resource, deduplicated by subject id. Rows may repeat the same
 * title across collections; a title only ever appears once in the rotation.
 */
export function heroCandidates(feed: MediaHomeFeed): MediaSubjectSummary[] {
  const seen = new Set<string>();
  const candidates: MediaSubjectSummary[] = [];
  for (const row of feed.rows) {
    for (const subject of row.subjects) {
      if (!subject.title?.trim()) continue;
      if (!subject.poster) continue;
      if (!subject.hasResource) continue;
      if (seen.has(subject.subjectId)) continue;
      seen.add(subject.subjectId);
      candidates.push(subject);
    }
  }
  return candidates;
}

/**
 * Fisher-Yates shuffle with an injectable RNG so tests stay deterministic
 * and page loads can vary their featured selection.
 */
export function shuffle<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const swap = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = swap;
  }
  return copy;
}

/**
 * Featured rotation for the home hero: eligible candidates, shuffled so
 * every load can differ, capped at {@link HERO_TITLE_LIMIT}. Never contains
 * duplicate titles.
 */
export function selectHeroTitles(
  feed: MediaHomeFeed,
  rng: () => number = Math.random,
): MediaSubjectSummary[] {
  return shuffle(heroCandidates(feed), rng).slice(0, HERO_TITLE_LIMIT);
}
