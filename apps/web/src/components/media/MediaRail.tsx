import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ZenIcon } from "../Icon/icons";
import "./MediaRail.css";

const SCROLL_EDGE_EPSILON = 1;

export interface MediaRailProps {
  title: string;
  /** Rendered as cards; the rail itself owns scrolling + nav. */
  children: ReactNode;
  className?: string;
}

/**
 * Horizontally scrolling rail of media cards. One title, one row,
 * horizontal scroll with keyboard support and (>= 1024px) prev/next
 * controls. The title heading lives on the parent (SectionHeader).
 */
export function MediaRail({ title, children, className }: MediaRailProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [canScrollBack, setCanScrollBack] = useState(true);
  const [canScrollForward, setCanScrollForward] = useState(true);

  const updateScrollState = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    setCanScrollBack(viewport.scrollLeft > SCROLL_EDGE_EPSILON);
    setCanScrollForward(
      viewport.scrollLeft + viewport.clientWidth < viewport.scrollWidth - SCROLL_EDGE_EPSILON,
    );
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

  return (
    <section className={`zs-media-rail${className ? ` ${className}` : ""}`} aria-label={title}>
      <div className="zs-media-rail__controls">
        <button
          type="button"
          className="zs-media-rail__scroll"
          aria-label={`Scroll ${title} backward`}
          disabled={!canScrollBack}
          onClick={() => scrollByStep(-1)}
        >
          <ZenIcon name="chevron-left" />
        </button>
        <button
          type="button"
          className="zs-media-rail__scroll"
          aria-label={`Scroll ${title} forward`}
          disabled={!canScrollForward}
          onClick={() => scrollByStep(1)}
        >
          <ZenIcon name="chevron-right" />
        </button>
      </div>
      <div className="zs-media-rail__viewport" role="group" aria-label={title} tabIndex={0} ref={viewportRef}>
        <div className="zs-media-rail__track">{children}</div>
      </div>
    </section>
  );
}