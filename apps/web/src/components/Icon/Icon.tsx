import type { ReactNode } from "react";

export interface IconProps {
  /** Icon size in px. Defaults to the current font size. */
  size?: number;
  /** When set, the icon becomes meaningful and receives this accessible name. */
  label?: string;
  className?: string;
  children: ReactNode;
}

export function Icon({ size, label, className, children }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={size ?? "1em"}
      height={size ?? "1em"}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}