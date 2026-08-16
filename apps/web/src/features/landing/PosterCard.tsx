import { Link } from "react-router-dom";
import type { FixtureTitle } from "./fixtures";
import { CinematicArt } from "./CinematicArt";
import "./PosterCard.css";

export interface PosterCardProps {
  title: FixtureTitle;
  /** Destination; omit to render a non-interactive presentation card. */
  to?: string;
  className?: string;
}

/**
 * Reusable poster card: original procedural artwork, title, year/genre
 * metadata, optional demo progress. Interacts like a link when `to` is set;
 * renders as a plain article inside presentation surfaces (ProductPreview).
 *
 * No ratings, no view counts, no popularity — fixture metadata only.
 */
export function PosterCard({ title, to, className }: PosterCardProps) {
  const classes = ["zs-poster", to ? undefined : "zs-poster--static", className].filter(Boolean).join(" ");

  const progress = title.progress;
  const progressValue = progress !== undefined ? Math.round(progress * 100) : undefined;

  const content = (
    <>
      <div className="zs-poster__media">
        <div className="zs-poster__art" aria-hidden="true">
          <CinematicArt seed={title.id} variant="poster" />
        </div>
        {progressValue !== undefined && (
          <div
            className="zs-poster__progress"
            role="progressbar"
            aria-label={`${title.title} — ${progressValue} percent watched (demo)`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressValue}
          >
            <span className="zs-poster__progress-fill" style={{ width: `${progressValue}%` }} />
          </div>
        )}
      </div>
      <div className="zs-poster__body">
        <span className="zs-poster__title">{title.title}</span>
        <span className="zs-poster__meta">
          {title.year} · {title.genre}
        </span>
      </div>
    </>
  );

  return to ? (
    <Link to={to} className={classes} data-testid="poster-card">
      {content}
    </Link>
  ) : (
    <article className={classes} data-testid="poster-card">
      {content}
    </article>
  );
}