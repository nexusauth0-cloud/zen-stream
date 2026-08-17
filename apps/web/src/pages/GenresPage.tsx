import { Link } from "react-router-dom";
import { useHomeFeed } from "../api/hooks";
import { EmptyState, ErrorState } from "../components/feedback/States";
import { SkeletonGrid } from "../components/feedback/LoadingSkeleton";
import { ZenIcon } from "../components/Icon/icons";
import "./GenresPage.css";

/**
 * Genres & categories page: every homepage row becomes a discoverable
 * category card linking to its live collection. No invented categories —
 * what the feed shows is what this page shows.
 */
export function GenresPage() {
  const { status, data, error, retry } = useHomeFeed();

  return (
    <section className="zs-genres">
      <header className="zs-genres__head">
        <h1 className="zs-genres__title">Genres &amp; Categories</h1>
        <p className="zs-genres__subtitle">Browse every collection in the catalog.</p>
      </header>

      {status === "loading" && <SkeletonGrid label="Loading categories" count={8} />}

      {status === "error" && (
        <ErrorState
          title="Categories are unavailable right now"
          message={error ?? undefined}
          onRetry={retry}
        />
      )}

      {status === "success" && data && data.rows.length === 0 && (
        <EmptyState title="No categories yet" message="The catalog feed is empty right now." />
      )}

      {status === "success" && data && data.rows.length > 0 && (
        <ul className="zs-genres__list">
          {data.rows.map((row) => (
            <li key={row.opId}>
              <Link to={`/collection/${row.opId}`} className="zs-genres__card">
                <span className="zs-genres__card-body">
                  <span className="zs-genres__card-title">{row.title}</span>
                  <span className="zs-genres__card-count">
                    {row.total} {row.total === 1 ? "title" : "titles"}
                  </span>
                </span>
                <ZenIcon name="chevron-right" size={18} className="zs-genres__card-arrow" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}