import { Hero } from "./Hero";
import { Featured } from "./Featured";
import { ContinueWatching } from "./ContinueWatching";
import { Categories } from "./Categories";
import { Discovery } from "./Discovery";
import { ProductPreview } from "./ProductPreview";
import { FinalCta } from "./FinalCta";
import { LandingFooter } from "./LandingFooter";
import { LANDING_COPY, MOVIE_TITLES, SERIES_TITLES } from "./fixtures";
import "./LandingPage.css";

/**
 * Zen-Stream cinematic landing experience.
 *
 * A deliberate journey: hero → featured → continue-watching concept →
 * categories → movie/series discovery → product preview → final CTA →
 * footer. Presentation-only fixtures; no catalog, no playback, no auth.
 */
export function LandingPage() {
  return (
    <div className="zs-landing">
      <Hero />
      <Featured />
      <ContinueWatching />
      <Categories />
      <Discovery id="zs-movies-title" heading={LANDING_COPY.moviesTitle} items={MOVIE_TITLES} to="/movies" />
      <Discovery id="zs-series-title" heading={LANDING_COPY.seriesTitle} items={SERIES_TITLES} to="/series" />
      <ProductPreview />
      <FinalCta />
      <LandingFooter />
    </div>
  );
}