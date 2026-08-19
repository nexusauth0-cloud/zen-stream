import type { MediaSubjectSummary } from "@zen-stream/contracts";
import { useWatchlist } from "../../store/watchlist";
import { ZenIcon } from "../Icon/icons";
import "./WatchlistButton.css";

export interface WatchlistButtonProps {
  item: MediaSubjectSummary;
  size?: "md" | "lg";
  className?: string;
  /** Label of the unsaved state; defaults to "My List". */
  label?: string;
  /** Label of the saved state; defaults to "In My List". */
  savedLabel?: string;
}

/**
 * Standalone watchlist toggle (details pages, hero). Shares the store with
 * the card-level save button, so state stays consistent everywhere. Callers
 * choose the label: "My List" for playable titles, "Save" for upcoming ones.
 */
export function WatchlistButton({
  item,
  size = "md",
  className,
  label = "My List",
  savedLabel = "In My List",
}: WatchlistButtonProps) {
  const { isSaved, toggle } = useWatchlist();
  const saved = isSaved(item.subjectId);

  return (
    <button
      type="button"
      className={[
        "zs-watchlist-button",
        `zs-watchlist-button--${size}`,
        saved ? "zs-watchlist-button--saved" : undefined,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-pressed={saved}
      onClick={() => toggle(item)}
    >
      <ZenIcon name={saved ? "check" : "bookmark"} size={size === "lg" ? 18 : 16} />
      {saved ? savedLabel : label}
    </button>
  );
}