import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ZenIcon } from "../Icon/icons";
import "./GlobalSearch.css";

const SEARCH_LABEL = "Search movies and series";

/**
 * Persistent desktop search utility (>= 768px; the mobile header already
 * carries the compact affordance). Submits to the search route, passing
 * the query along for a future search milestone.
 */
export function GlobalSearch() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");

  return (
    <form
      className="zs-global-search"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const query = value.trim();
        navigate(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
      }}
    >
      <div className="zs-global-search__field">
        <ZenIcon name="search" className="zs-global-search__icon" />
        <input
          type="search"
          className="zs-global-search__input"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={SEARCH_LABEL}
          aria-label={SEARCH_LABEL}
        />
      </div>
    </form>
  );
}