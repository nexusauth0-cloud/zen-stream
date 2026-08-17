import { BrowsePage } from "../features/browse/BrowsePage";
import { selectMovieRows } from "../features/browse/useBrowseSubjects";

export function MoviesPage() {
  return (
    <BrowsePage
      title="Movies"
      select={selectMovieRows}
      emptyMessage="No movies are available in the catalog right now."
    />
  );
}