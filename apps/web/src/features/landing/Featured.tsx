import { ZenIcon } from "../../components/Icon/icons";
import { ButtonLink } from "../../components/ButtonLink/ButtonLink";
import { FEATURED_TITLE, LANDING_COPY } from "./fixtures";
import { CinematicArt } from "./CinematicArt";
import "./Featured.css";

/**
 * Featured content: one large fixture movie with metadata and a wide
 * landscape artwork treatment. The CTA routes to the temporary movies
 * page — a real detail route arrives in a later milestone.
 */
export function Featured() {
  const { title } = FEATURED_TITLE;

  return (
    <section className="zs-section zs-featured" aria-labelledby="zs-featured-title">
      <p className="zs-section-eyebrow">{LANDING_COPY.featuredEyebrow}</p>
      <div className="zs-featured__grid">
        <div className="zs-featured__copy">
          <h2 id="zs-featured-title" className="zs-section-title zs-featured__title">
            {title}
          </h2>
          <p className="zs-featured__meta">
            {FEATURED_TITLE.genre} · {FEATURED_TITLE.year} · {FEATURED_TITLE.runtimeMinutes} min
          </p>
          <p className="zs-featured__synopsis">{FEATURED_TITLE.synopsis}</p>
          <div className="zs-featured__actions">
            <ButtonLink to="/movies" variant="primary" size="md">
              <ZenIcon name="play" />
              Explore
            </ButtonLink>
          </div>
        </div>
        <div className="zs-featured__art">
          <CinematicArt seed={FEATURED_TITLE.id} variant="backdrop" />
        </div>
      </div>
    </section>
  );
}