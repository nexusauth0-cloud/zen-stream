import { EmptyState, ErrorState } from "../../components/feedback/States";
import { SkeletonGrid } from "../../components/feedback/LoadingSkeleton";
import { MediaCard } from "../../components/media/MediaCard";
import { MediaGrid } from "../../components/media/MediaGrid";
import { SectionHeader } from "../../components/media/SectionHeader";
import { useBrowseSubjects } from "./useBrowseSubjects";
import "./BrowsePage.css";

export interface BrowsePageProps {
  title: string;
  /** Catalog kind for the browse collection. */
  kind: "movie" | "series";
  emptyMessage: string;
}

/**
 * Streaming catalog page: page heading, count, then one grid section per
 * real feed row of the requested kind (Popular, Latest, More … whatever
 * the live feed provides). Loading and error states keep the structure.
 */
export function BrowsePage({ title, kind, emptyMessage }: BrowsePageProps) {
  const { status, rows, total, error, retry } = useBrowseSubjects(kind);

  return (
    <section className="zs-browse">
      <header className="zs-browse__head">
        <h1 className="zs-browse__title">{title}</h1>
        {status === "success" && <p className="zs-browse__count">{total} titles</p>}
      </header>

      {status === "loading" && <SkeletonGrid label={`Loading ${title}`} />}

      {status === "error" && (
        <ErrorState
          title={`${title} are unavailable right now`}
          message={error ?? undefined}
          onRetry={retry}
        />
      )}

      {status === "success" && rows.length === 0 && (
        <EmptyState title="Nothing here yet" message={emptyMessage} />
      )}

      {status === "success" && rows.length > 0 && (
        <div className="zs-browse__sections">
          {rows.map((row) => (
            <section key={row.title} className="zs-browse__section" aria-label={row.title}>
              <SectionHeader title={row.title} />
              <MediaGrid>
                {row.subjects.map((subject) => (
                  <MediaCard key={subject.subjectId} item={subject} />
                ))}
              </MediaGrid>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}