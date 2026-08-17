import type { MediaHomeFeed, MediaSubjectSummary } from "@zen-stream/contracts";
import { useMemo, useState } from "react";
import { useHomeFeed } from "../../api/hooks";
import { ErrorState, EmptyState } from "../../components/feedback/States";
import { SkeletonRail } from "../../components/feedback/LoadingSkeleton";
import { Hero } from "../../components/media/Hero";
import { HeroCarousel } from "../../components/media/HeroCarousel";
import { MediaCard } from "../../components/media/MediaCard";
import { MediaRail } from "../../components/media/MediaRail";
import { SectionHeader } from "../../components/media/SectionHeader";
import { ZenIcon } from "../../components/Icon/icons";
import { selectHeroTitles } from "./heroCarousel";
import { PromoBanner } from "./PromoBanner";
import { interleavePromos, promoSlots } from "./promos";
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

/**
 * Maps a home row to a real "See all" destination. The live worker types
 * every content row as SUBJECTS_MOVIE, so the destination follows the
 * subjects' own types: series-only rows go to /series, movie-only rows to
 * /movies, and mixed or unusual rows to their full collection.
 */
function browseActionFor(row: MediaHomeFeed["rows"][number]): { label: string; to: string } {
  const kinds = new Set(row.subjects.map((subject) => subject.type));
  if (kinds.size === 1 && kinds.has("series")) return { label: "See all series", to: "/series" };
  if (kinds.size === 1 && kinds.has("movie")) return { label: "See all movies", to: "/movies" };
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

  // Stable per mount: featured order and promo placement never reshuffle
  // while the user scrolls, but a fresh page load can differ.
  const [heroRng] = useState(() => Math.random);
  const [promoSeed] = useState(() => Math.random());

  const contentRows = data?.rows.filter((row) => row.subjects.length > 0) ?? [];
  const rowsWithPromos = useMemo(
    () => interleavePromos(contentRows, promoSlots(contentRows.length, promoSeed)),
    [contentRows, promoSeed],
  );

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

  if (contentRows.length === 0) {
    return (
      <EmptyState
        title="Nothing to discover yet"
        message="The feed is empty. Check back soon."
      />
    );
  }

  // Featured rotation: up to ten real, eligible titles, shuffled per load.
  // Falls back to the single hero pick when nothing has artwork + resource.
  const heroItems = selectHeroTitles(data, heroRng);
  const featured =
    heroItems.length > 1 ? (
      <HeroCarousel items={heroItems} />
    ) : heroItems.length === 1 ? (
      <Hero item={heroItems[0]!} titleId="zs-hero-title" />
    ) : (
      hero && <Hero item={hero} titleId="zs-hero-title" />
    );

  return (
    <div className="zs-home-feed">
      {featured && <div className="zs-home-feed__hero">{featured}</div>}
      <div className="zs-home-feed__sections">
        {rowsWithPromos.map((entry) =>
          entry.promo ? (
            <PromoBanner key={entry.key} variant={entry.variant} />
          ) : (
            <section key={entry.key} className="zs-home-feed__section" aria-label={entry.row.title}>
              <SectionHeader title={entry.row.title} action={browseActionFor(entry.row)} />
              <MediaRail title={entry.row.title}>
                {entry.row.subjects.map((subject) => (
                  <MediaCard key={subject.subjectId} item={subject} className="zs-media-rail__card" />
                ))}
              </MediaRail>
            </section>
          ),
        )}
      </div>
    </div>
  );
}