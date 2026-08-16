import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ZenIcon } from "../../components/Icon/icons";
import type { FeedSection } from "./fixtures";
import { HOME_COPY } from "./fixtures";
import { PosterCard } from "./PosterCard";
import "./ContentRail.css";

export interface ContentRailProps {
  section: FeedSection;
  /** Destination for each poster card; omit to render presentation cards. */
  cardTo?: string;
  /** Destination for the "See all" action; omit to hide it. */
  seeAllTo?: string;
  /** Wider card layout, e.g. for the trending rail. */
  wide?: boolean;
  className?: string;
}

const SCROLL_EDGE_EPSILON = 1;

/**
 * Reusable horizontal content rail. One title, one row, horizontal
 * scrolling with keyboard support and (>= 1024px) prev/next controls.
 * No duplicated rail markup — every feed section renders through this.
 */
export function ContentRail({ section, cardTo, seeAllTo, wide = false, className }: ContentRailProps) {
  const titleId = useId();
  const viewportRef = useRef<HTMLDivElement>(null);
  const [canScrollBack, setCanScrollBack] = useState(true);
  const [canScrollForward, setCanScrollForward] = useState(true);

  const updateScrollState = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    setCanScrollBack(viewport.scrollLeft > SCROLL_EDGE_EPSILON);
    setCanScrollForward(viewport.scrollLeft + viewport.clientWidth < viewport.scrollWidth - SCROLL_EDGE_EPSILON);
  }, []);

  useEffect(() => {
    updateScrollState();
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      viewport.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  function scrollByStep(direction: -1 | 1) {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    viewport.scrollBy({
      left: direction * viewport.clientWidth * 0.85,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }

  const classes = ["zs-rail", wide ? "zs-rail--wide" : undefined, className].filter(Boolean).join(" ");

  return (
    <section className={classes} aria-labelledby={titleId}>
      <div className="zs-rail__head">
        <div className="zs-rail__titles">
          <h2 id={titleId} className="zs-rail__title">
            {section.title}
          </h2>
          {section.subtitle && <p className="zs-rail__subtitle">{section.subtitle}</p>}
        </div>
        <div className="zs-rail__actions">
          <button
            type="button"
            className="zs-rail__scroll-button"
            aria-label={`Scroll ${section.title} backward`}
            disabled={!canScrollBack}
            onClick={() => scrollByStep(-1)}
          >
            <ZenIcon name="chevron-left" />
          </button>
          <button
            type="button"
            className="zs-rail__scroll-button"
            aria-label={`Scroll ${section.title} forward`}
            disabled={!canScrollForward}
            onClick={() => scrollByStep(1)}
          >
            <ZenIcon name="chevron-right" />
          </button>
          {seeAllTo && (
            <Link className="zs-rail__see-all" to={seeAllTo}>
              {HOME_COPY.seeAll}
            </Link>
          )}
        </div>
      </div>
      {section.items.length > 0 ? (
        <div className="zs-rail__viewport" role="group" aria-label={section.title} tabIndex={0} ref={viewportRef}>
          <div className="zs-rail__track">
            {section.items.map((item) => (
              <PosterCard key={item.id} title={item} to={cardTo} className="zs-rail__card" />
            ))}
          </div>
        </div>
      ) : (
        <p className="zs-rail__empty">Nothing here yet — check back soon.</p>
      )}
    </section>
  );
}