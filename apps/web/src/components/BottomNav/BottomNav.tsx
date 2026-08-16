import { NavLink } from "react-router-dom";
import { ZenIcon } from "../Icon/icons";
import { MOBILE_NAV } from "../../app/navigation";
import "./BottomNav.css";

/**
 * Mobile bottom navigation (below 768px; hidden via CSS on larger screens).
 * Fixed to the viewport bottom; safe-area aware (bottom inset). The sidebar
 * is a different composition — this is not a collapsed rail.
 */
export function BottomNav() {
  return (
    <nav className="zs-bottom-nav" aria-label="Mobile navigation">
      <ul className="zs-bottom-nav__list">
        {MOBILE_NAV.map((item) => (
          <li key={item.to} className="zs-bottom-nav__item">
            <NavLink
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                ["zs-bottom-nav__link", isActive ? "zs-bottom-nav__link--active" : ""].filter(Boolean).join(" ")
              }
            >
              <span className="zs-bottom-nav__icon" aria-hidden="true">
                <ZenIcon name={item.icon} />
              </span>
              <span className="zs-bottom-nav__label">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}