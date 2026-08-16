import { ButtonLink } from "../../components/ButtonLink/ButtonLink";
import type { FeedTitle } from "./fixtures";
import { HOME_COPY } from "./fixtures";
import { CinematicArt } from "./CinematicArt";
import "./HomeHero.css";

function formatRuntime(minutes?: number): string | null {
  if (minutes === undefined) return null;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  return `${hours}h ${rest}m`;
}

/**
 * Homepage hero: the featured title as a cinematic backdrop with copy
 * overlaid lower-left. One composition — artwork, metadata, actions —
 * compact on mobile, full-width cinematic on desktop.
 */
export function HomeHero({ item }: { item: FeedTitle }) {
  const runtime = formatRuntime(item.runtimeMinutes);

  return (
    <section className="zs-home-hero" aria-labelledby="zs-home-hero-title">
      <div className="zs-home-hero__backdrop" aria-hidden="true">
        <CinematicArt seed={item.id} mood={item.artMood} variant="hero" />
      </div>
      <div className="zs-home-hero__content">
        <p className="zs-home-hero__eyebrow">{HOME_COPY.featured}</p>
        <h1 id="zs-home-hero-title" className="zs-home-hero__title">
          {item.title}
        </h1>
        <p className="zs-home-hero__meta">
          {item.year} · {item.genre}
          {runtime ? ` · ${runtime}` : null}
        </p>
        <p className="zs-home-hero__synopsis">{item.synopsis}</p>
        <div className="zs-home-hero__actions">
          <ButtonLink to="/movies" variant="primary" size="md">
            {HOME_COPY.watch}
          </ButtonLink>
          <ButtonLink to="/movies" variant="secondary" size="md">
            {HOME_COPY.moreInfo}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}