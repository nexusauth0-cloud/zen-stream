import type { MediaSubjectSummary } from "@zen-stream/contracts";
import { getMediaActions, getMediaAvailability } from "@zen-stream/contracts";
import { ButtonLink } from "../ButtonLink/ButtonLink";
import { ZenIcon } from "../Icon/icons";
import { WatchlistButton } from "./WatchlistButton";
import { ShareButton } from "./ShareButton";
import { MediaBadge } from "./MediaBadge";
import { MediaMetadata, releaseYear } from "./MediaMetadata";
import { RatingBadge } from "./RatingBadge";
import { detailsRouteFor } from "./MediaCard";
import "./Hero.css";

export interface HeroProps {
  item: MediaSubjectSummary;
  /** Label of the primary play action; defaults to "Watch". */
  watchLabel?: string;
  /**
   * id for the title heading. Omit when the hero is one of several slides
   * so hidden slides never produce duplicate ids.
   */
  titleId?: string;
  /** Optional preview URL; surfaces a Preview action for non-playable titles. */
  previewUrl?: string | null;
}

/**
 * Cinematic home hero: the featured title over a full-width artwork
 * surface with copy overlaid lower-left. Poster artwork is used as the
 * backdrop when present; otherwise a branded gradient fallback. The action
 * row is derived from the shared availability model — upcoming titles get
 * Save + Share instead of Watch, and never navigate into playback.
 */
export function Hero({ item, watchLabel = "Watch", titleId, previewUrl }: HeroProps) {
  const primaryLabel = watchLabel || "Watch";
  const availability = getMediaAvailability({
    releaseDate: item.releaseDate,
    hasResource: item.hasResource,
    previewUrl,
  });
  const actions = getMediaActions({
    releaseDate: item.releaseDate,
    hasResource: item.hasResource,
    previewUrl,
  });
  return (
    <section className="zs-hero" aria-labelledby={titleId}>
      <div className="zs-hero__backdrop" aria-hidden="true">
        {item.poster ? (
          <img className="zs-hero__backdrop-image" src={item.poster} alt="" />
        ) : (
          <div className="zs-hero__backdrop-fallback">
            <ZenIcon name="film" size={96} />
          </div>
        )}
      </div>
      <div className="zs-hero__content">
        <div className="zs-hero__badges">
          <MediaBadge type={item.type} />
          <RatingBadge rating={item.rating} />
        </div>
        <h1 id={titleId} className="zs-hero__title">
          {item.title}
        </h1>
        <MediaMetadata
          year={releaseYear(item.releaseDate)}
          runtime={item.runtime}
          genre={item.genre}
          language={item.language}
          country={item.country}
          className="zs-hero__meta"
        />
        {item.description && <p className="zs-hero__synopsis">{item.description}</p>}
        <div className="zs-hero__actions">
          {actions.watch && (
            <ButtonLink to={`/watch/${item.subjectId}`} variant="primary" size="md">
              <ZenIcon name="play" size={16} />
              {primaryLabel}
            </ButtonLink>
          )}
          {actions.preview && previewUrl && (
            <a
              className="zs-button zs-button--secondary"
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
            >
              <ZenIcon name="play" size={16} />
              Preview
            </a>
          )}
          {actions.save && (
            <WatchlistButton
              item={item}
              label={availability === "available" ? "My List" : "Save"}
              savedLabel={availability === "available" ? "In My List" : "Saved"}
            />
          )}
          {actions.share && <ShareButton url={detailsRouteFor(item)} title={item.title} />}
        </div>
      </div>
    </section>
  );
}