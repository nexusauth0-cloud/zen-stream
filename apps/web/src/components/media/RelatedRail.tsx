import { useMemo } from "react";
import type { MediaSubjectSummary, MediaType } from "@zen-stream/contracts";
import { useHomeFeed } from "../../api/hooks";
import { SkeletonRail } from "../feedback/LoadingSkeleton";
import { MediaCard } from "./MediaCard";
import { MediaRail } from "./MediaRail";
import { SectionHeader } from "./SectionHeader";
import "./RelatedRail.css";

export interface RelatedRailProps {
  subjectId: string;
  kind: MediaType;
}

/**
 * "You May Also Like" rail for details pages: real catalog subjects of the
 * same kind from the live home feed, excluding the current title. Omits
 * itself quietly when the feed is unavailable or has nothing related.
 */
export function RelatedRail({ subjectId, kind }: RelatedRailProps) {
  const { status, data } = useHomeFeed();

  const related = useMemo(() => {
    if (!data) return [];
    const seen = new Set<string>();
    const items: MediaSubjectSummary[] = [];
    for (const row of data.rows) {
      for (const subject of row.subjects) {
        if (subject.subjectId === subjectId) continue;
        if (subject.type !== kind) continue;
        if (seen.has(subject.subjectId)) continue;
        seen.add(subject.subjectId);
        items.push(subject);
        if (items.length >= 14) return items;
      }
    }
    return items;
  }, [data, subjectId, kind]);

  if (status === "loading") {
    return (
      <section className="zs-related" aria-label="You may also like">
        <SectionHeader title="You May Also Like" />
        <SkeletonRail label="Loading related titles" count={8} />
      </section>
    );
  }

  if (status !== "success" || related.length === 0) {
    return null;
  }

  return (
    <section className="zs-related" aria-label="You may also like">
      <SectionHeader title="You May Also Like" />
      <MediaRail title="You May Also Like">
        {related.map((subject) => (
          <MediaCard key={subject.subjectId} item={subject} className="zs-media-rail__card" />
        ))}
      </MediaRail>
    </section>
  );
}