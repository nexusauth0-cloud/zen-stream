import { NavLink } from "react-router-dom";
import { ZenIcon } from "../Icon/icons";
import { ACCOUNT_NAV, PRIMARY_NAV, SECONDARY_NAV, SIDEBAR_MICROCOPY } from "../../app/navigation";
import type { NavItem } from "../../app/navigation";
import "./Sidebar.css";

export interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

/**
 * Desktop/tablet sidebar navigation (>= 768px; hidden below via CSS).
 * Expanded: 248px with labels. Collapsed: 72px icon-only rail; labels stay
 * accessible (visually hidden, not removed).
 */
export function Sidebar({ collapsed, onToggleCollapsed }: SidebarProps) {
  const toggleLabel = collapsed ? "Expand sidebar" : "Collapse sidebar";

  return (
    <aside className="zs-sidebar" data-collapsed={collapsed} data-testid="sidebar">
      <div className="zs-sidebar__inner">
        <NavLink to="/" className="zs-brand" aria-label="Zen-Stream home">
          <span className="zs-brand__mark" aria-hidden="true">
            <ZenIcon name="mark" />
          </span>
          <span className="zs-brand__wordmark">Zen-Stream</span>
        </NavLink>

        <nav className="zs-nav" id="zs-sidebar-nav" aria-label="Primary navigation">
          <ul className="zs-nav__group" data-testid="nav-primary">
            {PRIMARY_NAV.map((item) => (
              <li key={item.to}>
                <NavItemLink {...item} />
              </li>
            ))}
          </ul>

          <ul className="zs-nav__group" data-testid="nav-secondary">
            {SECONDARY_NAV.map((item) => (
              <li key={item.to}>
                <NavItemLink {...item} />
              </li>
            ))}
          </ul>

          <ul className="zs-nav__group zs-nav__group--account" data-testid="nav-account">
            {ACCOUNT_NAV.map((item) => (
              <li key={item.to}>
                <NavItemLink {...item} />
              </li>
            ))}
          </ul>
        </nav>

        <div className="zs-sidebar__footer">
          <p className="zs-sidebar__microcopy">{SIDEBAR_MICROCOPY}</p>
          <button
            type="button"
            className="zs-sidebar__toggle"
            aria-expanded={!collapsed}
            aria-controls="zs-sidebar-nav"
            aria-label={toggleLabel}
            onClick={onToggleCollapsed}
          >
            <span className="zs-sidebar__toggle-icon" aria-hidden="true">
              <ZenIcon name={collapsed ? "chevron-right" : "chevron-left"} />
            </span>
            <span className="zs-sidebar__toggle-label">{toggleLabel}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavItemLink({ to, label, icon }: NavItem) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) => ["zs-nav-item", isActive ? "zs-nav-item--active" : ""].filter(Boolean).join(" ")}
    >
      <span className="zs-nav-item__icon" aria-hidden="true">
        <ZenIcon name={icon} />
      </span>
      <span className="zs-nav-item__label">{label}</span>
    </NavLink>
  );
}