import { Link } from "react-router-dom";
import type { MediaSubjectSummary } from "@zen-stream/contracts";
import { useWatchlist } from "../../store/watchlist";
import { ZenIcon } from "../Icon/icons";
import { MediaBadge } from "./MediaBadge";
import { MediaMetadata, releaseYear } from "./MediaMetadata";
import { RatingBadge } from "./RatingBadge";
import "./MediaCard.css";

export interface MediaCardProps {
  item: MediaSubjectSummary;
  className?: string;
  /** Override the default details destination (e.g. rails linking to browse). */
  to?: string;
}

/** Route for the details page of a subject, by canonical media type. */
export function detailsRouteFor(item: Pick<MediaSubjectSummary, "subjectId" | "type">): string {
  return item.type === "movie" ? `/movie/${item.subjectId}` : `/series/${item.subjectId}`;
}

/**
 * Catalog poster card. Real poster artwork when available, a quiet branded
 * fallback otherwise. Type and rating badges, plus a watchlist toggle that
 * must not navigate (stopPropagation is unnecessary — the toggle is a real
 * button beside the link, not nested inside it).
 */
export function MediaCard({ item, className, to }: MediaCardProps) {
  const { isSaved, toggle } = useWatchlist();
  const saved = isSaved(item.subjectId);
  const destination = to ?? detailsRouteFor(item);

  return (
    <article className={`zs-media-card${className ? ` ${className}` : ""}`}>
      <Link to={destination} className="zs-media-card__link" aria-label={item.title}>
        <div className="zs-media-card__media">
          {item.poster ? (
            <img
              className="zs-media-card__poster"
              src={item.poster}
              alt=""
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="zs-media-card__fallback" aria-hidden="true">
              <ZenIcon name="image" size={32} />
            </div>
          )}
          <div className="zs-media-card__badges">
            <MediaBadge type={item.type} />
            <RatingBadge rating={item.rating} />
          </div>
        </div>
        <div className="zs-media-card__body">
          <span className="zs-media-card__title">{item.title}</span>
          <MediaMetadata
            year={releaseYear(item.releaseDate)}
            genre={item.genre}
            className="zs-media-card__meta"
          />
        </div>
      </Link>
      <button
        type="button"
        className={`zs-media-card__save${saved ? " zs-media-card__save--saved" : ""}`}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${item.title} from My List` : `Add ${item.title} to My List`}
        onClick={() => toggle(item)}
      >
        <ZenIcon name={saved ? "check" : "bookmark"} size={16} />
      </button>
    </article>
  );
}