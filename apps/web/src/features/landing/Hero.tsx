import { ZenIcon } from "../../components/Icon/icons";
import { ButtonLink } from "../../components/ButtonLink/ButtonLink";
import { LANDING_COPY } from "./fixtures";
import { CinematicArt } from "./CinematicArt";
import "./Hero.css";

/**
 * Hero: dominates the first viewport. Left copy (eyebrow, editorial
 * headline, support, CTAs), right cinematic composition with layered
 * artwork and small player/metadata accents. All visual elements are
 * decorative (aria-hidden); copy carries the meaning.
 */
export function Hero() {
  return (
    <section className="zs-hero" aria-labelledby="zs-hero-heading">
      <div className="zs-hero__copy">
        <p className="zs-hero__eyebrow zs-rise" style={{ animationDelay: "0ms" }}>
          {LANDING_COPY.eyebrow}
        </p>
        <h1 id="zs-hero-heading" className="zs-hero__headline zs-rise" style={{ animationDelay: "80ms" }}>
          {LANDING_COPY.heroHeadline}
        </h1>
        <p className="zs-hero__support zs-rise" style={{ animationDelay: "160ms" }}>
          {LANDING_COPY.heroSupport}
        </p>
        <div className="zs-hero__actions zs-rise" style={{ animationDelay: "240ms" }}>
          <ButtonLink to="/movies" variant="primary" size="md">
            {LANDING_COPY.primaryCta}
          </ButtonLink>
          <ButtonLink to="/series" variant="secondary" size="md">
            {LANDING_COPY.secondaryCta}
          </ButtonLink>
        </div>
      </div>

      <div className="zs-hero__visual zs-rise" style={{ animationDelay: "200ms" }} aria-hidden="true">
        <CinematicArt seed="zen-hero" variant="hero" className="zs-hero__art" />
        <div className="zs-hero__card zs-hero__card--poster">
          <div className="zs-hero__card-art">
            <CinematicArt seed="signal-zero" variant="poster" />
          </div>
          <span className="zs-hero__card-title">Signal Zero</span>
          <span className="zs-hero__card-meta">2024 · Thriller</span>
        </div>
        <div className="zs-hero__chip zs-hero__chip--player">
          <span className="zs-hero__chip-icon">
            <ZenIcon name="play" />
          </span>
          <span className="zs-hero__chip-text">
            <span className="zs-hero__chip-label">Now previewing</span>
            <span className="zs-hero__chip-title">The Long Afterlight</span>
          </span>
        </div>
        <div className="zs-hero__chip zs-hero__chip--meta">
          <span className="zs-hero__chip-title">Signal Zero</span>
          <span className="zs-hero__chip-label">1:52:00 runtime</span>
        </div>
      </div>
    </section>
  );
}