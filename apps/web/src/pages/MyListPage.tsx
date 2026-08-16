import { Link } from "react-router-dom";
import { useWatchlist } from "../store/watchlist";
import { EmptyState } from "../components/feedback/States";
import { MediaCard } from "../components/media/MediaCard";
import { MediaGrid } from "../components/media/MediaGrid";
import "./MyListPage.css";

export function MyListPage() {
  const { items } = useWatchlist();

  return (
    <section className="zs-my-list">
      <header className="zs-my-list__head">
        <h1 className="zs-my-list__title">My List</h1>
        <p className="zs-my-list__count">
          {items.length} {items.length === 1 ? "title" : "titles"}
        </p>
      </header>

      {items.length === 0 ? (
        <EmptyState
          title="Your list is empty"
          message="Titles you save appear here so you can find them again fast."
        >
          <Link className="zs-button zs-button--primary" to="/">
            Browse the catalog
          </Link>
        </EmptyState>
      ) : (
        <MediaGrid>
          {items.map((item) => (
            <MediaCard key={item.subjectId} item={item} />
          ))}
        </MediaGrid>
      )}
    </section>
  );
}