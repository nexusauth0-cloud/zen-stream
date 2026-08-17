import { BrowsePage } from "../features/browse/BrowsePage";
import { selectMostWatchedRows } from "../features/browse/useBrowseSubjects";

export function MostWatchedPage() {
  return (
    <BrowsePage
      title="Most Watched"
      select={selectMostWatchedRows}
      emptyMessage="No popularity collections are in the feed right now."
    />
  );
}