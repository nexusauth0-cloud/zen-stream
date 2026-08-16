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
  | "mark";

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