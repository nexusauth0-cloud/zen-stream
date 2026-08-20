import type { MediaSubjectSummary } from "@zen-stream/contracts";
import { formatComingSoonLabel, getMediaAvailability } from "@zen-stream/contracts";
import { ZenIcon } from "../Icon/icons";
import { MediaBadge } from "./MediaBadge";
import { ShareButton } from "./ShareButton";
import { WatchlistButton } from "./WatchlistButton";
import "./ComingSoonDetails.css";

export interface ComingSoonDetailsProps {
  item: MediaSubjectSummary;
  /** Real preview/trailer URL when one exists; never invented. */
  previewUrl?: string | null;
}

/**
 * Compact Coming Soon details state for a title that is known to be
 * upcoming from trusted metadata (cached from earlier successful fetches),
 * rendered when the live providers are unavailable. Shows the release
 * date, Save and Share, and Preview only when a real preview exists —
 * never a Watch action for a title that has not released.
 */
export function ComingSoonDetails({ item, previewUrl }: ComingSoonDetailsProps) {
  const availability = getMediaAvailability(item);
  const label = formatComingSoonLabel(item.releaseDate, { year: true });
  const detailUrl =
    item.type === "movie" ? `/movie/${item.subjectId}` : `/series/${item.subjectId}`;

  if (availability !== "coming-soon") return null;

  return (
    <section className="zs-details-hero zs-coming-soon-details" aria-labelledby="zs-coming-soon-details-title">
      <div className="zs-details-hero__backdrop" aria-hidden="true">
        {item.poster ? (
          <img className="zs-details-hero__backdrop-image" src={item.poster} alt="" />
        ) : (
          <div className="zs-details-hero__backdrop-fallback">
            <ZenIcon name="film" size={96} />
          </div>
        )}
      </div>
      <div className="zs-details-hero__content">
        <div className="zs-details-hero__badges">
          <MediaBadge type={item.type} />
        </div>
        <h1 id="zs-coming-soon-details-title" className="zs-details-hero__title">
          {item.title}
        </h1>
        <p className="zs-coming-soon-details__release">
          <ZenIcon name="calendar" size={16} />
          {label ?? "Coming soon"}
        </p>
        <div className="zs-details-hero__actions">
          {previewUrl && (
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
          <WatchlistButton item={item} label="Save" savedLabel="Saved" />
          <ShareButton url={detailUrl} title={item.title} />
        </div>
      </div>
    </section>
  );
}