import { Link } from "react-router-dom";
import type { FixtureTitle } from "./fixtures";
import { PosterCard } from "./PosterCard";
import "./Discovery.css";

export interface DiscoveryProps {
  heading: string;
  items: FixtureTitle[];
  /** Destination for cards and the "See all" link. */
  to: string;
  id: string;
}

/**
 * Movie/series discovery: heading, "See all" link, responsive poster grid.
 * Small deterministic fixture sets — no ratings, no view counts.
 */
export function Discovery({ heading, items, to, id }: DiscoveryProps) {
  return (
    <section className="zs-section" aria-labelledby={id}>
      <div className="zs-section__head">
        <h2 id={id} className="zs-section-title">
          {heading}
        </h2>
        <Link to={to} className="zs-see-all">
          See all
        </Link>
      </div>
      <ul className="zs-rail">
        {items.map((title) => (
          <li key={title.id} className="zs-rail__item">
            <PosterCard title={title} to={to} />
          </li>
        ))}
      </ul>
    </section>
  );
}