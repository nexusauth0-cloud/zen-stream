import { BrowsePage } from "../features/browse/BrowsePage";
import { selectSeriesRows } from "../features/browse/useBrowseSubjects";

export function SeriesPage() {
  return (
    <BrowsePage
      title="TV Series"
      select={selectSeriesRows}
      emptyMessage="No series are available in the catalog right now."
    />
  );
}