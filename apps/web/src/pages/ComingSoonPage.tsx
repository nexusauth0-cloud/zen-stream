import { Link } from "react-router-dom";
import { useHomeFeed } from "../api/hooks";
import { EmptyState, ErrorState } from "../components/feedback/States";
import { SkeletonGrid } from "../components/feedback/LoadingSkeleton";
import { MediaCard } from "../components/media/MediaCard";
import { MediaGrid } from "../components/media/MediaGrid";
import { collectUpcoming } from "../features/home/HomeFeed";
import "./ComingSoonPage.css";

/**
 * Upcoming releases, derived from the live home feed (never fabricated).
 * Cards carry their real release dates and Save actions; nothing here
 * navigates into playback.
 */
export function ComingSoonPage() {
  const { status, data, error, retry } = useHomeFeed();

  if (status === "loading") {
    return (
      <section className="zs-coming-soon" aria-label="Loading Coming Soon">
        <div className="zs-coming-soon__head">
          <h1 className="zs-coming-soon__title">Coming Soon</h1>
        </div>
        <SkeletonGrid count={8} />
      </section>
    );
  }

  if (status === "error" || !data) {
    return (
      <section className="zs-coming-soon">
        <div className="zs-coming-soon__head">
          <h1 className="zs-coming-soon__title">Coming Soon</h1>
        </div>
        <ErrorState
          title="Upcoming titles are unavailable right now"
          message={error ?? undefined}
          onRetry={retry}
        />
      </section>
    );
  }

  const upcoming = collectUpcoming(data);

  if (upcoming.length === 0) {
    return (
      <section className="zs-coming-soon">
        <div className="zs-coming-soon__head">
          <h1 className="zs-coming-soon__title">Coming Soon</h1>
          <p className="zs-coming-soon__count">Nothing announced yet</p>
        </div>
        <EmptyState
          title="Nothing upcoming right now"
          message="Titles that have a release date in the future will appear here."
        >
          <Link className="zs-button zs-button--primary" to="/">
            Browse the catalog
          </Link>
        </EmptyState>
      </section>
    );
  }

  return (
    <section className="zs-coming-soon">
      <header className="zs-coming-soon__head">
        <h1 className="zs-coming-soon__title">Coming Soon</h1>
        <p className="zs-coming-soon__count">
          {upcoming.length} {upcoming.length === 1 ? "title" : "titles"} on the way
        </p>
      </header>
      <MediaGrid>
        {upcoming.map((item) => (
          <MediaCard key={item.subjectId} item={item} />
        ))}
      </MediaGrid>
    </section>
  );
}