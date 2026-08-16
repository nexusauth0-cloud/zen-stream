import { BrowsePage } from "../features/browse/BrowsePage";

export function SeriesPage() {
  return (
    <BrowsePage
      title="TV Series"
      kind="series"
      emptyMessage="No series are available in the catalog right now."
    />
  );
}