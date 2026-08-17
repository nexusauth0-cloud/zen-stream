import { useMemo } from "react";
import type { MediaHomeRow, MediaSubjectSummary } from "@zen-stream/contracts";
import { useHomeFeed } from "../../api/hooks";
import type { AsyncState } from "../../api/hooks";

export type FeedRowSelector = (row: MediaHomeRow) => boolean;

/** Catalog rows whose subjects are movies. */
export const selectMovieRows: FeedRowSelector = (row) =>
  row.subjects.some((subject) => subject.type === "movie");

/** Catalog rows whose subjects are series. */
export const selectSeriesRows: FeedRowSelector = (row) =>
  row.subjects.some((subject) => subject.type === "series");

/** Animation catalog: any feed collection about anime or animation. */
export const selectAnimationRows: FeedRowSelector = (row) =>
  /anime|animation/i.test(row.title);

/** Most-watched catalog: the feed's own popularity signals. */
export const selectMostWatchedRows: FeedRowSelector = (row) =>
  /popular|trending|most watched|must-watch|hot/i.test(row.title);

export interface BrowseRow {
  title: string;
  subjects: MediaSubjectSummary[];
}

export interface BrowseSubjectsState {
  status: AsyncState<unknown>["status"];
  /** Feed rows selected by the caller, deduplicated across the page. */
  rows: BrowseRow[];
  total: number;
  error: string | null;
  retry: () => void;
}

/**
 * Browse catalog derived from the live home feed: every row the selector
 * matches becomes a section (e.g. "Popular Movie", "Nollywood Movie",
 * "Anime[English Dubbed]"), deduplicated by subject id across the page.
 * Real catalog data only — no fixtures.
 *
 * Rows are classified by their subjects' own type: the live worker types
 * every content row as SUBJECTS_MOVIE regardless of what the row contains,
 * so the per-subject type is the reliable signal.
 */
export function useBrowseSubjects(select: FeedRowSelector): BrowseSubjectsState {
  const { status, data, error, retry } = useHomeFeed();

  const rows = useMemo(() => {
    if (!data) return [];
    const seen = new Set<string>();
    const sections: BrowseRow[] = [];
    for (const row of data.rows.filter(select)) {
      const subjects: MediaSubjectSummary[] = [];
      for (const subject of row.subjects) {
        if (seen.has(subject.subjectId)) continue;
        seen.add(subject.subjectId);
        subjects.push(subject);
      }
      if (subjects.length > 0) sections.push({ title: row.title, subjects });
    }
    return sections;
  }, [data, select]);

  const total = useMemo(
    () => rows.reduce((sum, row) => sum + row.subjects.length, 0),
    [rows],
  );

  return { status, rows, total, error, retry };
}