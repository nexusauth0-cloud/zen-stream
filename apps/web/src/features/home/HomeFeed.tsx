import type { MediaHomeFeed, MediaSubjectSummary } from "@zen-stream/contracts";
import { useHomeFeed } from "../../api/hooks";
import { ErrorState, EmptyState } from "../../components/feedback/States";
import { SkeletonRail } from "../../components/feedback/LoadingSkeleton";
import { Hero } from "../../components/media/Hero";
import { MediaCard } from "../../components/media/MediaCard";
import { MediaRail } from "../../components/media/MediaRail";
import { SectionHeader } from "../../components/media/SectionHeader";
import { ZenIcon } from "../../components/Icon/icons";
import "./HomeFeed.css";

/** Picks the featured hero subject: first item with an available resource. */
export function heroSubject(feed: MediaHomeFeed): MediaSubjectSummary | null {
  for (const row of feed.rows) {
    for (const subject of row.subjects) {
      if (subject.hasResource) return subject;
    }
  }
  return feed.rows[0]?.subjects[0] ?? null;
}

/** Maps a home row to a real "See all" destination. */
function browseActionFor(row: MediaHomeFeed["rows"][number]): { label: string; to: string } {
  if (row.type === "SUBJECTS_MOVIE") return { label: "See all movies", to: "/movies" };
  if (row.type === "SUBJECTS_TV") return { label: "See all series", to: "/series" };
  return { label: "View all", to: `/collection/${row.opId}` };
}

/** Plausible section names shown while the real feed loads. */
const SKELETON_SECTIONS = ["Popular Movies", "Popular Series", "Trending Now", "Anime & More"];

/**
 * API-driven discovery home: hero from the feed, then one rail per feed
 * row. Loading renders the full page skeleton (hero + titled rails), and
 * errors keep the page architecture visible with a hero surface and a
 * retry card — no fixture data.
 */
export function HomeFeed() {
  const { status, data, error, retry } = useHomeFeed();

  if (status === "loading") {
    return (
      <div className="zs-home-feed">
        <div className="zs-home-feed__hero-skeleton" role="status" aria-label="Loading featured content" />
        <div className="zs-home-feed__sections">
          {SKELETON_SECTIONS.map((title) => (
            <section key={title} className="zs-home-feed__section" aria-label={`Loading ${title}`}>
              <div className="zs-skeleton-section">
                <span className="zs-skeleton-section__title" />
              </div>
              <SkeletonRail label={`Loading ${title}`} count={8} />
            </section>
          ))}
        </div>
      </div>
    );
  }

  if (status === "error" || !data) {
    return (
      <div className="zs-home-feed">
        <div className="zs-home-feed__hero-unavailable" aria-hidden="true">
          <ZenIcon name="film" size={64} />
        </div>
        <div className="zs-home-feed__error">
          <ErrorState
            title="The feed is unavailable right now"
            message={error ?? undefined}
            onRetry={retry}
          />
        </div>
      </div>
    );
  }

  const hero = heroSubject(data);

  if (data.rows.length === 0) {
    return (
      <EmptyState
        title="Nothing to discover yet"
        message="The feed is empty. Check back soon."
      />
    );
  }

  return (
    <div className="zs-home-feed">
      {hero && (
        <div className="zs-home-feed__hero">
          <Hero item={hero} />
        </div>
      )}
      <div className="zs-home-feed__sections">
        {data.rows.map((row) => (
          <section key={row.opId} className="zs-home-feed__section" aria-label={row.title}>
            <SectionHeader title={row.title} action={browseActionFor(row)} />
            <MediaRail title={row.title}>
              {row.subjects.map((subject) => (
                <MediaCard key={subject.subjectId} item={subject} className="zs-media-rail__card" />
              ))}
            </MediaRail>
          </section>
        ))}
      </div>
    </div>
  );
}