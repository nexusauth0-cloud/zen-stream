import { PlaceholderPage } from "../components/PlaceholderPage/PlaceholderPage";

export function MoviePage() {
  return (
    <PlaceholderPage
      title="Movie details"
      description="Details and playback arrive in a later milestone."
      route="/movie/:subjectId"
    />
  );
}