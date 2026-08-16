import type { MediaType } from "@zen-stream/contracts";
import "./MediaBadge.css";

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  movie: "Movie",
  series: "Series",
  shorts: "Shorts",
};

export interface MediaBadgeProps {
  type: MediaType;
  className?: string;
}

/** Small pill identifying the media type (movie / series / shorts). */
export function MediaBadge({ type, className }: MediaBadgeProps) {
  return (
    <span className={`zs-media-badge zs-media-badge--${type}${className ? ` ${className}` : ""}`}>
      {MEDIA_TYPE_LABELS[type]}
    </span>
  );
}