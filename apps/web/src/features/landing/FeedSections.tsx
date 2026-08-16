import { useEffect, useRef, useState } from "react";
import type { FeedSection } from "./fixtures";
import { ContentRail } from "./ContentRail";
import "./FeedSections.css";

const INITIAL_SECTIONS = 8;
const REVEAL_STEP = 4;
const REVEAL_ROOT_MARGIN = "480px 0px";

interface RailDestination {
  cardTo?: string;
  seeAllTo?: string;
  wide?: boolean;
}

function railDestination(section: FeedSection): RailDestination {
  switch (section.kind) {
    case "series-rail":
      return { cardTo: "/series", seeAllTo: "/series" };
    case "continue-rail":
      // Continue-watching cards are mixed movie/series; movie route stands
      // in until real title routes exist.
      return { cardTo: "/movies" };
    case "trending":
      return { cardTo: "/movies", seeAllTo: "/movies", wide: true };
    default:
      return { cardTo: "/movies", seeAllTo: "/movies" };
  }
}

/**
 * Composes feed sections into the homepage and mounts them progressively:
 * the first batch renders immediately, then an IntersectionObserver reveals
 * more as the user scrolls — the pattern a backend-backed infinite feed
 * (M4/M5) will keep. Without IntersectionObserver (jsdom, older browsers)
 * every section renders at once.
 */
export function FeedSections({ sections }: { sections: FeedSection[] }) {
  const supportsIo = typeof IntersectionObserver !== "undefined";
  const [visibleCount, setVisibleCount] = useState(() => (supportsIo ? INITIAL_SECTIONS : sections.length));
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!supportsIo || visibleCount >= sections.length) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((count) => Math.min(count + REVEAL_STEP, sections.length));
        }
      },
      { rootMargin: REVEAL_ROOT_MARGIN },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sections.length, supportsIo, visibleCount]);

  const shown = sections.slice(0, visibleCount);

  return (
    <div className="zs-feed">
      {shown.map((section) => (
        <ContentRail key={section.id} section={section} {...railDestination(section)} />
      ))}
      {visibleCount < sections.length && <div ref={sentinelRef} className="zs-feed__sentinel" aria-hidden="true" />}
    </div>
  );
}