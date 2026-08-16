import "./MediaMetadata.css";

export interface MediaMetadataProps {
  year?: string | null;
  runtime?: number | null;
  genre?: string | null;
  language?: string | null;
  country?: string | null;
  className?: string;
}

function formatRuntime(runtime: number): string {
  const hours = Math.floor(runtime / 60);
  const rest = runtime % 60;
  if (hours === 0) return `${rest}m`;
  return `${hours}h ${rest}m`;
}

/** Joins available metadata fragments (year · runtime · genre). */
export function MediaMetadata({ year, runtime, genre, language, country, className }: MediaMetadataProps) {
  const segments: string[] = [];
  if (year) segments.push(year);
  if (runtime !== null && runtime !== undefined) segments.push(formatRuntime(runtime));
  if (genre) segments.push(genre);
  if (language) segments.push(language);
  if (country) segments.push(country);

  if (segments.length === 0) return null;

  return <p className={`zs-media-meta${className ? ` ${className}` : ""}`}>{segments.join(" · ")}</p>;
}

/** Extracts the release year from an ISO date string when present. */
export function releaseYear(releaseDate: string | null): string | null {
  if (!releaseDate) return null;
  const match = /^\d{4}/.exec(releaseDate);
  return match ? match[0] : null;
}