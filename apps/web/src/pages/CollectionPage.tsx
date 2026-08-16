import { useParams } from "react-router-dom";
import { useHomeSubjects } from "../api/hooks";
import { EmptyState, ErrorState } from "../components/feedback/States";
import { SkeletonGrid } from "../components/feedback/LoadingSkeleton";
import { MediaCard } from "../components/media/MediaCard";
import { MediaGrid } from "../components/media/MediaGrid";
import "../features/browse/BrowsePage.css";

/**
 * Collection page: every home rail's "View all" destination. Shows the
 * full subject grid for a dynamic home row (Anime, K-Drama, genres, …).
 */
export function CollectionPage() {
  const { opId } = useParams<{ opId: string }>();
  const { status, data, error, retry } = useHomeSubjects(opId);

  return (
    <section className="zs-browse">
      <header className="zs-browse__head">
        <h1 className="zs-browse__title">{data?.title ?? "Collection"}</h1>
        {data && <p className="zs-browse__count">{data.total} titles</p>}
      </header>

      {status === "loading" && <SkeletonGrid label="Loading collection" />}

      {status === "error" && (
        <ErrorState
          title="This collection is unavailable right now"
          message={error ?? undefined}
          onRetry={retry}
        />
      )}

      {status === "success" && data && data.subjects.length === 0 && (
        <EmptyState title="Nothing here yet" message="This collection is empty. Check back soon." />
      )}

      {status === "success" && data && data.subjects.length > 0 && (
        <MediaGrid>
          {data.subjects.map((subject) => (
            <MediaCard key={subject.subjectId} item={subject} />
          ))}
        </MediaGrid>
      )}
    </section>
  );
}