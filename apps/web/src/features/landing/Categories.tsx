import { Link } from "react-router-dom";
import { CATEGORIES, LANDING_COPY } from "./fixtures";
import { CinematicArt } from "./CinematicArt";
import "./Categories.css";

/**
 * Browse categories: compact navigation surfaces only. They currently
 * route to /movies; a future `?genre=` query comes with the catalog.
 */
export function Categories() {
  return (
    <section className="zs-section" aria-labelledby="zs-categories-title">
      <div className="zs-section__head">
        <p className="zs-section-eyebrow">{LANDING_COPY.categoriesEyebrow}</p>
        <h2 id="zs-categories-title" className="zs-section-title">
          {LANDING_COPY.categoriesTitle}
        </h2>
      </div>
      <ul className="zs-categories">
        {CATEGORIES.map((category) => (
          <li key={category.id} className="zs-categories__item">
            <Link to="/movies" className="zs-category">
              <div className="zs-category__art" aria-hidden="true">
                <CinematicArt seed={category.id} variant="backdrop" />
                <span className="zs-category__shade" aria-hidden="true" />
              </div>
              <span className="zs-category__label">{category.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}