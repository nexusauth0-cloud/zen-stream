import "./LoadingSkeleton.css";

export interface SkeletonRailProps {
  /** Number of placeholder posters. */
  count?: number;
  /** Accessible label for the loading region. */
  label?: string;
}

/** A row of pulsing poster placeholders for rails while data loads. */
export function SkeletonRail({ count = 10, label = "Loading" }: SkeletonRailProps) {
  return (
    <div className="zs-skeleton-rail" role="status" aria-label={label}>
      <div className="zs-skeleton-rail__track">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="zs-skeleton-card">
            <div className="zs-skeleton-card__poster" />
            <div className="zs-skeleton-card__line" />
          </div>
        ))}
      </div>
      <span className="zs-sr-only">{label}</span>
    </div>
  );
}

export interface SkeletonGridProps {
  count?: number;
  label?: string;
}

/** A responsive grid of poster placeholders for grids while data loads. */
export function SkeletonGrid({ count = 12, label = "Loading" }: SkeletonGridProps) {
  return (
    <div className="zs-skeleton-grid" role="status" aria-label={label}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="zs-skeleton-card">
          <div className="zs-skeleton-card__poster" />
          <div className="zs-skeleton-card__line" />
        </div>
      ))}
      <span className="zs-sr-only">{label}</span>
    </div>
  );
}