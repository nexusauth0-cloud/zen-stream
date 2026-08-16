import { EmptyState, ErrorState } from "../../components/feedback/States";
import { SkeletonGrid } from "../../components/feedback/LoadingSkeleton";
import { MediaCard } from "../../components/media/MediaCard";
import { MediaGrid } from "../../components/media/MediaGrid";
import { useBrowseSubjects } from "./useBrowseSubjects";
import "./BrowsePage.css";

export interface BrowsePageProps {
  title: string;
  /** Catalog kind for the browse collection. */
  kind: "movie" | "series";
  emptyMessage: string;
}

/**
 * Streaming browse page: page heading, count, and a responsive grid of
 * real catalog subjects with loading / empty / error states.
 */
export function BrowsePage({ title, kind, emptyMessage }: BrowsePageProps) {
  const { status, subjects, total, error, retry } = useBrowseSubjects(kind);

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

      {status === "success" && subjects.length === 0 && (
        <EmptyState title="Nothing here yet" message={emptyMessage} />
      )}

      {status === "success" && subjects.length > 0 && (
        <MediaGrid>
          {subjects.map((subject) => (
            <MediaCard key={subject.subjectId} item={subject} />
          ))}
        </MediaGrid>
      )}
    </section>
  );
}