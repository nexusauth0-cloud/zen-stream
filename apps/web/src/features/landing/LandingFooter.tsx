import { Link } from "react-router-dom";
import { ZenIcon } from "../../components/Icon/icons";
import { HOME_COPY } from "./fixtures";
import "./LandingFooter.css";

/**
 * Compact app footer: brand, primary destinations, one-line statement and
 * legal placeholder. No fake social links, no fake legal pages — Privacy
 * and Terms are reserved for a later milestone.
 */
export function LandingFooter() {
  return (
    <footer className="zs-landing-footer">
      <div className="zs-landing-footer__inner">
        <div className="zs-landing-footer__brand">
          <span className="zs-landing-footer__mark" aria-hidden="true">
            <ZenIcon name="mark" />
          </span>
          <span className="zs-landing-footer__name">Zen-Stream</span>
          <p className="zs-landing-footer__statement">{HOME_COPY.footerStatement}</p>
        </div>
        <nav className="zs-landing-footer__nav" aria-label="Footer">
          <Link to="/movies">Movies</Link>
          <Link to="/series">Series</Link>
          <Link to="/search">Search</Link>
          <Link to="/my-list">My List</Link>
          <Link to="/account">Account</Link>
        </nav>
        <p className="zs-landing-footer__legal">{HOME_COPY.footerLegal}</p>
      </div>
    </footer>
  );
}