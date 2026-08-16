import { ZenIcon } from "../Icon/icons";
import "./RatingBadge.css";

export interface RatingBadgeProps {
  /** Raw rating value; hidden when missing. */
  rating: number | null;
  className?: string;
}

/** Compact star rating badge, omitted entirely when there is no rating. */
export function RatingBadge({ rating, className }: RatingBadgeProps) {
  if (rating === null) return null;
  return (
    <span className={`zs-rating-badge${className ? ` ${className}` : ""}`}>
      <ZenIcon name="star" size={12} />
      {rating.toFixed(1)}
    </span>
  );
}