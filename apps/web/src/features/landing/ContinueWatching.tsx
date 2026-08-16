import { CONTINUE_WATCHING_TITLES, LANDING_COPY } from "./fixtures";
import { PosterCard } from "./PosterCard";
import "./ContinueWatching.css";

/**
 * "Continue watching" concept: demonstrates where future resume playback
 * will live. Deterministic demo fixtures with illustrative progress —
 * no user history, no analytics, no persistence.
 */
export function ContinueWatching() {
  return (
    <section className="zs-section" aria-labelledby="zs-continue-title">
      <div className="zs-section__head">
        <h2 id="zs-continue-title" className="zs-section-title">
          {LANDING_COPY.continueEyebrow}
        </h2>
        <p className="zs-section__note">{LANDING_COPY.continueNote}</p>
      </div>
      <ul className="zs-rail zs-rail--cards">
        {CONTINUE_WATCHING_TITLES.map((title) => (
          <li key={title.id} className="zs-rail__item">
            <PosterCard title={title} to="/movies" />
          </li>
        ))}
      </ul>
    </section>
  );
}