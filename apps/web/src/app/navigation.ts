import type { ZenIconName } from "../components/Icon/icons";

/**
 * Zen-Stream navigation model — the single source of truth for the header
 * and the mobile bottom navigation. Route strings must match the router.
 */

export interface NavItem {
  to: string;
  label: string;
  icon: ZenIconName;
}

/** Header destinations (desktop inline nav). */
export const PRIMARY_NAV: readonly NavItem[] = [
  { to: "/", label: "Home", icon: "home" },
  { to: "/movies", label: "Movies", icon: "film" },
  { to: "/series", label: "TV Series", icon: "tv" },
  { to: "/animation", label: "Animation", icon: "sparkle" },
  { to: "/most-watched", label: "Most Watched", icon: "flame" },
  { to: "/genres", label: "Genres", icon: "grid" },
];

/** Mobile bottom navigation — the primary mobile destinations. */
export const MOBILE_NAV: readonly NavItem[] = [
  { to: "/", label: "Home", icon: "home" },
  { to: "/movies", label: "Movies", icon: "film" },
  { to: "/series", label: "Series", icon: "tv" },
  { to: "/search", label: "Search", icon: "search" },
  { to: "/my-list", label: "My List", icon: "bookmark" },
];

/** Footer destinations — only pages that exist. */
export const FOOTER_NAV: readonly { label: string; to: string }[] = [
  { label: "Home", to: "/" },
  { label: "Movies", to: "/movies" },
  { label: "TV Series", to: "/series" },
  { label: "Animation", to: "/animation" },
  { label: "Most Watched", to: "/most-watched" },
  { label: "Genres", to: "/genres" },
  { label: "Search", to: "/search" },
  { label: "Coming Soon", to: "/coming-soon" },
  { label: "My List", to: "/my-list" },
];

/** Supporting microcopy for the footer. */
export const FOOTER_STATEMENT =
  "Zen-Stream — discover movies, TV series, and shorts in one place.";