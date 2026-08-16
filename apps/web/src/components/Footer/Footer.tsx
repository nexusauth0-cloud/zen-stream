import { Link } from "react-router-dom";
import { ZenIcon } from "../Icon/icons";
import { FOOTER_NAV, FOOTER_STATEMENT } from "../../app/navigation";
import "./Footer.css";

/**
 * Streaming-platform footer: brand, statement, and navigation to real
 * pages only. No dead links, no fake legal pages.
 */
export function Footer() {
  return (
    <footer className="zs-footer">
      <div className="zs-footer__inner">
        <div className="zs-footer__brand">
          <span className="zs-footer__mark" aria-hidden="true">
            <ZenIcon name="mark" />
          </span>
          <span className="zs-footer__name">Zen-Stream</span>
          <p className="zs-footer__statement">{FOOTER_STATEMENT}</p>
        </div>
        <nav className="zs-footer__nav" aria-label="Footer">
          <ul className="zs-footer__nav-list">
            {FOOTER_NAV.map((item) => (
              <li key={item.to}>
                <Link to={item.to}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="zs-footer__legal">© {new Date().getFullYear()} Zen-Stream. All rights reserved.</p>
      </div>
    </footer>
  );
}