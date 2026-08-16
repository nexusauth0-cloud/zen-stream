import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ZenIcon } from "../Icon/icons";
import { PRIMARY_NAV } from "../../app/navigation";
import type { NavItem } from "../../app/navigation";
import "./Header.css";

const SEARCH_LABEL = "Search movies and TV shows";

/**
 * Streaming top header. Desktop: brand, inline nav, and a search field.
 * Mobile: brand + search affordance (full nav lives in the bottom nav).
 * Sticky, compact, safe-area aware.
 */
export function Header() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  return (
    <header className="zs-header">
      <div className="zs-header__inner">
        <Link to="/" className="zs-header__brand" aria-label="Zen-Stream home">
          <span className="zs-header__mark" aria-hidden="true">
            <ZenIcon name="mark" />
          </span>
          <span className="zs-header__wordmark">Zen-Stream</span>
        </Link>

        <nav className="zs-header__nav" aria-label="Primary navigation">
          <ul className="zs-header__nav-list">
            {PRIMARY_NAV.map((item) => (
              <li key={item.to}>
                <HeaderNavLink {...item} />
              </li>
            ))}
          </ul>
        </nav>

        <form
          className="zs-header__search"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            const value = query.trim();
            navigate(value ? `/search?q=${encodeURIComponent(value)}` : "/search");
          }}
        >
          <div className="zs-header__search-field">
            <ZenIcon name="search" className="zs-header__search-icon" />
            <input
              type="search"
              className="zs-header__search-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={SEARCH_LABEL}
              aria-label={SEARCH_LABEL}
            />
            <button type="submit" className="zs-header__search-submit" aria-label={SEARCH_LABEL}>
              <ZenIcon name="search" />
            </button>
          </div>
        </form>

        <Link to="/search" className="zs-header__search-link" aria-label="Search">
          <ZenIcon name="search" />
        </Link>
      </div>
    </header>
  );
}

function HeaderNavLink({ to, label }: NavItem) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        ["zs-header__nav-link", isActive ? "zs-header__nav-link--active" : ""].filter(Boolean).join(" ")
      }
    >
      {label}
    </NavLink>
  );
}