import { useCallback, useEffect, useRef, useState } from "react";
import type { MediaSubjectSummary } from "@zen-stream/contracts";
import { ZenIcon } from "../Icon/icons";
import { Hero } from "./Hero";
import "./HeroCarousel.css";

const ROTATION_MS = 6500;

export interface HeroCarouselProps {
  items: MediaSubjectSummary[];
}

/**
 * Featured-title carousel for the home hero. Rotates through up to ten
 * real titles, pauses while the user hovers, focuses, or the tab is hidden,
 * and preloads only the upcoming slide's artwork. Inactive slides stay in
 * the DOM for a smooth fade but are inert and hidden from assistive tech.
 */
export function HeroCarousel({ items }: HeroCarouselProps) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const pausedByFocus = useRef(false);

  const goTo = useCallback(
    (index: number) => setActive(((index % items.length) + items.length) % items.length),
    [items.length],
  );
  const step = useCallback(
    (direction: -1 | 1) => setActive((current) => (current + direction + items.length) % items.length),
    [items.length],
  );

  useEffect(() => setActive(0), [items]);

  useEffect(() => {
    if (items.length < 2 || paused) return;
    const timer = setInterval(() => {
      setActive((current) => (current + 1) % items.length);
    }, ROTATION_MS);
    return () => clearInterval(timer);
  }, [items.length, paused]);

  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (items.length < 2) return;
    const next = items[(active + 1) % items.length]!;
    if (next.poster) {
      const image = new Image();
      image.src = next.poster;
    }
  }, [items, active]);

  if (items.length === 1) {
    return <Hero item={items[0]!} titleId="zs-hero-title" />;
  }

  return (
    <section
      className="zs-hero-carousel"
      aria-label="Featured titles"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        if (!pausedByFocus.current) setPaused(false);
      }}
      onFocus={() => {
        pausedByFocus.current = true;
        setPaused(true);
      }}
      onBlur={() => {
        pausedByFocus.current = false;
        setPaused(false);
      }}
    >
      {items.map((item, index) => (
        <div
          key={item.subjectId}
          className={`zs-hero-carousel__slide${index === active ? " zs-hero-carousel__slide--active" : ""}`}
          aria-hidden={index !== active}
          inert={index !== active}
        >
          <Hero item={item} titleId={index === active ? "zs-hero-title" : undefined} />
        </div>
      ))}

      <div className="zs-hero-carousel__arrows">
        <button
          type="button"
          className="zs-hero-carousel__arrow"
          aria-label="Previous featured title"
          onClick={() => step(-1)}
        >
          <ZenIcon name="chevron-left" />
        </button>
        <button
          type="button"
          className="zs-hero-carousel__arrow"
          aria-label="Next featured title"
          onClick={() => step(1)}
        >
          <ZenIcon name="chevron-right" />
        </button>
      </div>

      <div className="zs-hero-carousel__dots" role="group" aria-label="Featured title selector">
        {items.map((item, index) => (
          <button
            key={item.subjectId}
            type="button"
            className={`zs-hero-carousel__dot${index === active ? " zs-hero-carousel__dot--active" : ""}`}
            aria-label={`Show ${item.title}`}
            aria-current={index === active ? "true" : undefined}
            onClick={() => goTo(index)}
          />
        ))}
      </div>
    </section>
  );
}
