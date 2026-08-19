import type { MediaInfo } from "@zen-stream/contracts";
import { formatComingSoonLabel, getMediaActions, getMediaAvailability } from "@zen-stream/contracts";
import { ButtonLink } from "../ButtonLink/ButtonLink";
import { ZenIcon } from "../Icon/icons";
import { WatchlistButton } from "./WatchlistButton";
import { ShareButton } from "./ShareButton";
import { MediaBadge } from "./MediaBadge";
import { MediaMetadata, releaseYear } from "./MediaMetadata";
import { RatingBadge } from "./RatingBadge";
import "./DetailsHero.css";

export interface DetailsHeroProps {
  info: MediaInfo;
  /** Label of the primary play action. */
  watchLabel?: string;
  /** Optional preview URL; surfaces a Preview action for non-playable titles. */
  previewUrl?: string | null;
}

/**
 * Details-page hero: full-width backdrop surface with the title, metadata,
 * synopsis, and availability-aware actions (Watch / Save / Share, or the
 * honest "Coming Aug 28" state for upcoming titles). Shared by movies and
 * series; series pages add a season selector below.
 */
export function DetailsHero({ info, watchLabel = "Watch now", previewUrl }: DetailsHeroProps) {
  const availability = getMediaAvailability({
    releaseDate: info.releaseDate,
    hasResource: info.hasResource,
    previewUrl,
  });
  const actions = getMediaActions({
    releaseDate: info.releaseDate,
    hasResource: info.hasResource,
    previewUrl,
  });
  const comingSoonLabel = formatComingSoonLabel(info.releaseDate, { year: true });
  const detailUrl = info.type === "movie" ? `/movie/${info.subjectId}` : `/series/${info.subjectId}`;

  return (
    <section className="zs-details-hero" aria-labelledby="zs-details-hero-title">
      <div className="zs-details-hero__backdrop" aria-hidden="true">
        {info.poster ? (
          <img className="zs-details-hero__backdrop-image" src={info.poster} alt="" />
        ) : (
          <div className="zs-details-hero__backdrop-fallback">
            <ZenIcon name="film" size={96} />
          </div>
        )}
      </div>
      <div className="zs-details-hero__content">
        <div className="zs-details-hero__badges">
          <MediaBadge type={info.type} />
          <RatingBadge rating={info.rating} />
        </div>
        <h1 id="zs-details-hero-title" className="zs-details-hero__title">
          {info.title}
        </h1>
        <MediaMetadata
          year={releaseYear(info.releaseDate)}
          runtime={info.runtime}
          genre={info.genre}
          language={info.language}
          country={info.country}
          className="zs-details-hero__meta"
        />
        {info.description && <p className="zs-details-hero__synopsis">{info.description}</p>}
        <div className="zs-details-hero__actions">
          {actions.watch && (
            <ButtonLink to={`/watch/${info.subjectId}`} variant="primary" size="md">
              <ZenIcon name="play" size={16} />
              {watchLabel}
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
              item={{
                subjectId: info.subjectId,
                type: info.type,
                title: info.title,
                poster: info.poster,
                hasResource: info.hasResource,
                description: info.description,
                releaseDate: info.releaseDate,
                runtime: info.runtime,
                genre: info.genre,
                rating: info.rating,
                language: info.language,
                country: info.country,
              }}
              label={availability === "available" ? "My List" : "Save"}
              savedLabel={availability === "available" ? "In My List" : "Saved"}
            />
          )}
          {actions.share && <ShareButton url={detailUrl} title={info.title} />}
          {availability === "coming-soon" && comingSoonLabel && (
            <p className="zs-details-hero__release">{comingSoonLabel}</p>
          )}
          {availability === "unavailable" && (
            <p className="zs-details-hero__release">Not available to stream yet</p>
          )}
        </div>
      </div>
    </section>
  );
}