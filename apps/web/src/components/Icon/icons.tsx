import type { ReactNode } from "react";
import { Icon } from "./Icon";

/**
 * Zen-Stream icon set — small original library built on the Icon primitive.
 *
 * Language: clean, simple, rounded, consistent 2px stroke (Icon default),
 * slightly cinematic. No emoji, no third-party packages, no copied SVGs.
 *
 * Icons are decorative by default (Icon sets aria-hidden). Any control whose
 * only label is an icon must pass an accessible name (aria-label / label prop).
 */

export type ZenIconName =
  | "home"
  | "film"
  | "tv"
  | "search"
  | "bookmark"
  | "clock"
  | "user"
  | "menu"
  | "chevron-left"
  | "chevron-right"
  | "play"
  | "mark"
  | "star"
  | "alert"
  | "check"
  | "plus"
  | "info"
  | "image"
  | "grid"
  | "sparkle"
  | "flame"
  | "download"
  | "share"
  | "calendar";

export const ZEN_ICON_PATHS: Record<ZenIconName, ReactNode> = {
  home: (
    <>
      <path d="M3.5 10.5 12 3.5l8.5 7" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  film: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M3.5 9h17M3.5 15h17M8.5 4.5v4M8.5 15v4.5M15.5 4.5v4M15.5 15v4.5" />
    </>
  ),
  tv: (
    <>
      <rect x="3.5" y="5" width="17" height="12" rx="2" />
      <path d="m10 8.5 5 2.5-5 2.5z" />
      <path d="M9 20.5h6M12 17v3.5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  bookmark: <path d="M7 4.5h10a1 1 0 0 1 1 1V20l-6-3.5L6 20V5.5a1 1 0 0 1 1-1z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5V12l3 1.8" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.8" />
      <path d="M5 19.5c1.4-3.4 4-4.7 7-4.7s5.6 1.3 7 4.7" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  "chevron-left": <path d="m14.5 6-6 6 6 6" />,
  "chevron-right": <path d="m9.5 6 6 6-6 6" />,
  play: <path d="M8 5.5v13l11-6.5z" />,
  mark: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4.5" />
      <path d="M8.5 8.5h7l-7 7h7" />
    </>
  ),
  star: (
    <path d="m12 3.5 2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 9.7l5.9-.9z" />
  ),
  alert: (
    <>
      <path d="M12 4 2.5 20h19z" />
      <path d="M12 10v4" />
      <path d="M12 17.2v.3" />
    </>
  ),
  check: <path d="m4.5 12.5 5 5 10-11" />,
  plus: <path d="M12 5v14M5 12h14" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5" />
      <path d="M12 7.8v.3" />
    </>
  ),
  image: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <circle cx="9" cy="9.5" r="1.6" />
      <path d="m4.5 17.5 5-4.5 3.5 3 3-2.5 3.5 4" />
    </>
  ),
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  sparkle: (
    <path d="M12 4c.5 4.4 2.7 6.6 7 7-4.3.4-6.5 2.6-7 7-.5-4.4-2.7-6.6-7-7 4.3-.4 6.5-2.6 7-7z" />
  ),
  flame: (
    <path d="M12 3.5c1.4 2.5 4.4 4 4.4 7.4a4.4 4.4 0 0 1-8.8 0c0-1.6.7-2.9 1.5-4.1.4 1.1 1.1 1.9 2 2.3-.3-2.4-.1-4.3 1.7-5.6z" />
  ),
  download: (
    <>
      <path d="M12 4v10" />
      <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
      <path d="M4.5 16.5v2a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-2" />
    </>
  ),
  share: (
    <>
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="5.5" r="2.5" />
      <circle cx="18" cy="18.5" r="2.5" />
      <path d="m8.2 10.8 7.6-4.1M8.2 13.2l7.6 4.1" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.5h17M8 3.5v3.5M16 3.5v3.5" />
    </>
  ),
};

export interface ZenIconProps {
  name: ZenIconName;
  className?: string;
  size?: number;
}

/** Renders a decorative Zen-Stream icon (aria-hidden; label via the control). */
export function ZenIcon({ name, className, size }: ZenIconProps) {
  return (
    <Icon className={className} size={size}>
      {ZEN_ICON_PATHS[name]}
    </Icon>
  );
}