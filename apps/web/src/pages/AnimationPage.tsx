import { BrowsePage } from "../features/browse/BrowsePage";
import { selectAnimationRows } from "../features/browse/useBrowseSubjects";

export function AnimationPage() {
  return (
    <BrowsePage
      title="Animation"
      select={selectAnimationRows}
      emptyMessage="No animation collections are in the feed right now."
    />
  );
}