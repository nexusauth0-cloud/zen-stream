import { Link } from "react-router-dom";
import { ZenIcon } from "../Icon/icons";
import "./SectionHeader.css";

export interface SectionHeaderProps {
  title: string;
  subtitle?: string | null;
  /** Label + destination for the trailing action link. */
  action?: { label: string; to: string };
  className?: string;
}

/** Section heading with optional subtitle and "see all" style action. */
export function SectionHeader({ title, subtitle, action, className }: SectionHeaderProps) {
  const classes = ["zs-section-header", className].filter(Boolean).join(" ");
  return (
    <div className={classes}>
      <div className="zs-section-header__titles">
        <h2 className="zs-section-header__title">{title}</h2>
        {subtitle && <p className="zs-section-header__subtitle">{subtitle}</p>}
      </div>
      {action && (
        <Link className="zs-section-header__action" to={action.to}>
          {action.label}
          <ZenIcon name="chevron-right" size={14} />
        </Link>
      )}
    </div>
  );
}