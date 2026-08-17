import { useMemo } from "react";
import type { MediaSubjectSummary } from "@zen-stream/contracts";
import { useHomeFeed } from "../../api/hooks";
import type { AsyncState } from "../../api/hooks";

export interface BrowseRow {
  title: string;
  subjects: MediaSubjectSummary[];
}

export interface BrowseSubjectsState {
  status: AsyncState<unknown>["status"];
  /** Feed rows of the requested kind, deduplicated across the page. */
  rows: BrowseRow[];
  total: number;
  error: string | null;
  retry: () => void;
}

/**
 * Browse catalog derived from the live home feed: every row whose type
 * matches the requested kind becomes a section (e.g. "New Movies",
 * "Nollywood Movie"), deduplicated by subject id across the page. Real
 * catalog data only — no fixtures.
 */
export function useBrowseSubjects(kind: "movie" | "series"): BrowseSubjectsState {
  const { status, data, error, retry } = useHomeFeed();

  const rows = useMemo(() => {
    if (!data) return [];
    const seen = new Set<string>();
    const source =
      kind === "movie"
        ? data.rows.filter((row) => row.type === "SUBJECTS_MOVIE")
        : data.rows.filter((row) => row.type === "SUBJECTS_TV");
    const sections: BrowseRow[] = [];
    for (const row of source) {
      const subjects: MediaSubjectSummary[] = [];
      for (const subject of row.subjects) {
        if (seen.has(subject.subjectId)) continue;
        seen.add(subject.subjectId);
        subjects.push(subject);
      }
      if (subjects.length > 0) sections.push({ title: row.title, subjects });
    }
    return sections;
  }, [data, kind]);

  const total = useMemo(
    () => rows.reduce((sum, row) => sum + row.subjects.length, 0),
    [rows],
  );

  return { status, rows, total, error, retry };
}