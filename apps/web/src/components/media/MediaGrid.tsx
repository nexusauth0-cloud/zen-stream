import type { ReactNode } from "react";
import "./MediaGrid.css";

export interface MediaGridProps {
  children: ReactNode;
  className?: string;
}

/** Responsive poster grid — more columns as the viewport grows. */
export function MediaGrid({ children, className }: MediaGridProps) {
  return <div className={`zs-media-grid${className ? ` ${className}` : ""}`}>{children}</div>;
}