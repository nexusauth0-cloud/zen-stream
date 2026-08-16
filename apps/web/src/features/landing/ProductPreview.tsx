import { ZenIcon } from "../../components/Icon/icons";
import { FEATURED_TITLE, LANDING_COPY, MOVIE_TITLES, SERIES_TITLES } from "./fixtures";
import { CinematicArt } from "./CinematicArt";
import { PosterCard } from "./PosterCard";
import "./ProductPreview.css";

/**
 * Real product preview: a mini Zen-Stream application composed from actual
 * React components and primitives — not a screenshot, not a static image.
 *
 * Presentation-only: no playback, no API calls, no navigation inside the
 * frames. PosterCard instances are non-interactive (no `to`).
 */
export function ProductPreview() {
  return (
    <section className="zs-section zs-preview-section" aria-labelledby="zs-preview-title">
      <div className="zs-section__head">
        <div>
          <p className="zs-section-eyebrow">{LANDING_COPY.previewEyebrow}</p>
          <h2 id="zs-preview-title" className="zs-section-title">
            {LANDING_COPY.previewTitle}
          </h2>
        </div>
        <p className="zs-preview-section__support">{LANDING_COPY.previewSupport}</p>
      </div>
      <div className="zs-preview-frames">
        <DesktopPreview />
        <MobilePreview />
      </div>
    </section>
  );
}

function DesktopPreview() {
  const runtime = FEATURED_TITLE.runtimeMinutes ?? 0;
  const elapsed = Math.round(runtime * 0.68);
  const total = `${Math.floor(runtime / 60)}:${String(runtime % 60).padStart(2, "0")}:00`;
  const watched = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}:00`;

  return (
    <div className="zs-preview-window" data-testid="product-preview-desktop" aria-hidden="true">
      <div className="zs-preview-window__sidebar">
        <span className="zs-preview-window__brand">
          <ZenIcon name="mark" />
        </span>
        {(["home", "film", "tv", "search", "bookmark"] as const).map((name, i) => (
          <span
            key={name}
            className={["zs-preview-window__nav", i === 1 ? "zs-preview-window__nav--active" : ""].filter(Boolean).join(" ")}
          >
            <ZenIcon name={name} />
          </span>
        ))}
      </div>
      <div className="zs-preview-window__main">
        <div className="zs-preview-window__topbar">
          <span className="zs-preview-window__search">
            <ZenIcon name="search" />
            Search movies and series…
          </span>
          <span className="zs-preview-window__user">
            <ZenIcon name="user" />
          </span>
        </div>
        <div className="zs-preview-window__featured">
          <CinematicArt seed={FEATURED_TITLE.id} variant="backdrop" className="zs-preview-window__featured-art" />
          <div className="zs-preview-window__featured-copy">
            <span className="zs-preview-window__featured-eyebrow">Featured</span>
            <span className="zs-preview-window__featured-title">{FEATURED_TITLE.title}</span>
            <span className="zs-preview-window__featured-meta">
              {FEATURED_TITLE.genre} · {FEATURED_TITLE.year}
            </span>
          </div>
          <span className="zs-preview-window__play">
            <ZenIcon name="play" />
          </span>
        </div>
        <div className="zs-preview-window__row">
          {MOVIE_TITLES.slice(0, 4).map((title) => (
            <PosterCard key={title.id} title={title} className="zs-preview-window__poster" />
          ))}
        </div>
        <div className="zs-preview-window__player">
          <span className="zs-preview-window__player-icon">
            <ZenIcon name="play" />
          </span>
          <span className="zs-preview-window__player-title">{FEATURED_TITLE.title}</span>
          <span className="zs-preview-window__player-progress">
            <span className="zs-preview-window__player-progress-fill" />
          </span>
          <span className="zs-preview-window__player-time">
            {watched} / {total}
          </span>
        </div>
      </div>
    </div>
  );
}

function MobilePreview() {
  return (
    <div className="zs-preview-phone" data-testid="product-preview-mobile" aria-hidden="true">
      <div className="zs-preview-phone__header">
        <span className="zs-preview-phone__brand">
          <ZenIcon name="mark" />
        </span>
        <span className="zs-preview-phone__wordmark">Zen-Stream</span>
        <span className="zs-preview-phone__search">
          <ZenIcon name="search" />
        </span>
      </div>
      <div className="zs-preview-phone__featured">
        <CinematicArt seed="second-moon" variant="backdrop" className="zs-preview-phone__featured-art" />
        <span className="zs-preview-phone__featured-title">{SERIES_TITLES[4]?.title ?? "Second Moon"}</span>
        <span className="zs-preview-phone__play">
          <ZenIcon name="play" />
        </span>
      </div>
      <div className="zs-preview-phone__row">
        {MOVIE_TITLES.slice(0, 3).map((title) => (
          <PosterCard key={title.id} title={title} className="zs-preview-phone__poster" />
        ))}
      </div>
      <div className="zs-preview-phone__bottomnav">
        {(["home", "film", "search", "bookmark", "user"] as const).map((name, i) => (
          <span
            key={name}
            className={["zs-preview-phone__nav", i === 0 ? "zs-preview-phone__nav--active" : ""].filter(Boolean).join(" ")}
          >
            <ZenIcon name={name} />
          </span>
        ))}
      </div>
    </div>
  );
}