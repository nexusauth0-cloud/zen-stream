import type { MediaInfo } from "@zen-stream/contracts";
import { ButtonLink } from "../ButtonLink/ButtonLink";
import { ZenIcon } from "../Icon/icons";
import { WatchlistButton } from "./WatchlistButton";
import { MediaBadge } from "./MediaBadge";
import { MediaMetadata, releaseYear } from "./MediaMetadata";
import { RatingBadge } from "./RatingBadge";
import "./DetailsHero.css";

export interface DetailsHeroProps {
  info: MediaInfo;
  /** Label of the primary play action. */
  watchLabel?: string;
}

/**
 * Details-page hero: full-width backdrop surface with the title, metadata,
 * synopsis, and primary actions (Watch / My List). Shared by movies and
 * series; series pages add a season selector below.
 */
export function DetailsHero({ info, watchLabel = "Watch now" }: DetailsHeroProps) {
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
          {info.hasResource ? (
            <ButtonLink to={`/watch/${info.subjectId}`} variant="primary" size="md">
              <ZenIcon name="play" size={16} />
              {watchLabel}
            </ButtonLink>
          ) : (
            <p className="zs-details-hero__unavailable">Not available to stream yet</p>
          )}
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
          />
        </div>
      </div>
    </section>
  );
}