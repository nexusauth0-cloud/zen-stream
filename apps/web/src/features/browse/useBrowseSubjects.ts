import { useMemo } from "react";
import type { MediaSubjectSummary } from "@zen-stream/contracts";
import { useHomeFeed } from "../../api/hooks";
import type { AsyncState } from "../../api/hooks";

export interface BrowseSubjectsState {
  status: AsyncState<unknown>["status"];
  subjects: MediaSubjectSummary[];
  total: number;
  error: string | null;
  retry: () => void;
}

/**
 * Subjects for a browse page, derived from the live home feed: every row
 * whose type matches the requested kind, deduplicated by subject id. Real
 * catalog data only — no fixtures.
 */
export function useBrowseSubjects(kind: "movie" | "series"): BrowseSubjectsState {
  const { status, data, error, retry } = useHomeFeed();

  const subjects = useMemo(() => {
    if (!data) return [];
    const seen = new Set<string>();
    const rows =
      kind === "movie"
        ? data.rows.filter((row) => row.type === "SUBJECTS_MOVIE")
        : data.rows.filter((row) => row.type === "SUBJECTS_TV");
    const items: MediaSubjectSummary[] = [];
    for (const row of rows) {
      for (const subject of row.subjects) {
        if (seen.has(subject.subjectId)) continue;
        seen.add(subject.subjectId);
        items.push(subject);
      }
    }
    return items;
  }, [data, kind]);

  return {
    status,
    subjects,
    total: subjects.length,
    error,
    retry,
  };
}