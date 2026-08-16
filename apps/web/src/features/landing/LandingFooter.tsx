import { Link } from "react-router-dom";
import { ZenIcon } from "../../components/Icon/icons";
import { LANDING_COPY } from "./fixtures";
import "./LandingFooter.css";

/**
 * Simple landing footer. No fake social links, no fake legal pages —
 * Privacy and Terms are reserved for a later milestone.
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
          <p className="zs-landing-footer__statement">{LANDING_COPY.footerStatement}</p>
        </div>
        <nav className="zs-landing-footer__nav" aria-label="Footer">
          <Link to="/movies">Movies</Link>
          <Link to="/series">Series</Link>
          <Link to="/search">Search</Link>
          <Link to="/account">Account</Link>
        </nav>
        <p className="zs-landing-footer__legal">{LANDING_COPY.footerLegal}</p>
      </div>
    </footer>
  );
}