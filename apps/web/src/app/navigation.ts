import type { ZenIconName } from "../components/Icon/icons";

/**
 * Zen-Stream navigation model — the single source of truth for the sidebar
 * and the mobile bottom navigation. Route strings must match the router.
 */

export interface NavItem {
  to: string;
  label: string;
  icon: ZenIconName;
}

/** Primary destinations. */
export const PRIMARY_NAV: readonly NavItem[] = [
  { to: "/", label: "Home", icon: "home" },
  { to: "/movies", label: "Movies", icon: "film" },
  { to: "/series", label: "Series", icon: "tv" },
  { to: "/search", label: "Search", icon: "search" },
];

/** Secondary destinations. */
export const SECONDARY_NAV: readonly NavItem[] = [
  { to: "/my-list", label: "My List", icon: "bookmark" },
  { to: "/history", label: "History", icon: "clock" },
];

/** Lower (account) section. */
export const ACCOUNT_NAV: readonly NavItem[] = [{ to: "/account", label: "Account", icon: "user" }];

/** Mobile bottom navigation — the primary mobile destinations. */
export const MOBILE_NAV: readonly NavItem[] = [
  { to: "/", label: "Home", icon: "home" },
  { to: "/movies", label: "Movies", icon: "film" },
  { to: "/search", label: "Search", icon: "search" },
  { to: "/my-list", label: "My List", icon: "bookmark" },
  { to: "/account", label: "Account", icon: "user" },
];

/** Supporting microcopy for the sidebar footer. */
export const SIDEBAR_MICROCOPY = "Your next watch is closer than you think.";

/** Stable localStorage key for the collapsed-sidebar preference. */
export const SIDEBAR_STORAGE_KEY = "zen-stream.sidebar-collapsed";