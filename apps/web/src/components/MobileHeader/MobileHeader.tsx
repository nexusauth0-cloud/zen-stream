import { Link } from "react-router-dom";
import { ZenIcon } from "../Icon/icons";
import "./MobileHeader.css";

/**
 * Mobile top header (below 768px; hidden via CSS on larger screens).
 * Compact brand + a search affordance. Safe-area aware (top inset).
 */
export function MobileHeader() {
  return (
    <header className="zs-mobile-header">
      <Link to="/" className="zs-mobile-header__brand" aria-label="Zen-Stream home">
        <span className="zs-mobile-header__mark" aria-hidden="true">
          <ZenIcon name="mark" />
        </span>
        <span className="zs-mobile-header__wordmark">Zen-Stream</span>
      </Link>
      <Link to="/search" className="zs-mobile-header__search" aria-label="Search">
        <ZenIcon name="search" />
      </Link>
    </header>
  );
}