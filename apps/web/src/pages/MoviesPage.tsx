import { BrowsePage } from "../features/browse/BrowsePage";

export function MoviesPage() {
  return (
    <BrowsePage
      title="Movies"
      kind="movie"
      emptyMessage="No movies are available in the catalog right now."
    />
  );
}