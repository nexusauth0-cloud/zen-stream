/**
 * PRESENTATION-ONLY FIXTURES.
 *
 * There is no catalog backend yet. Everything in this module is deterministic,
 * locally defined development content used to demonstrate layout, artwork,
 * and interaction. It must never be presented as production catalog data.
 * Future API models belong elsewhere (e.g. packages/contracts) and will not
 * live inside the landing feature.
 *
 * Explicitly absent on purpose:
 * - no user counts, watch counts, or streaming statistics
 * - no popularity claims or "most watched" statements
 * - no licensing or availability claims
 */

export interface FixtureTitle {
  id: string;
  title: string;
  year: number;
  genre: string;
  /** Runtime in minutes; only meaningful for movies. */
  runtimeMinutes?: number;
  synopsis?: string;
  /**
   * Demo-only resume position, 0..1. Purely illustrative for the
   * "continue watching" concept — never derived from real user history.
   */
  progress?: number;
}

export const FEATURED_TITLE: FixtureTitle = {
  id: "the-long-afterlight",
  title: "The Long Afterlight",
  year: 2025,
  genre: "Science Fiction",
  runtimeMinutes: 128,
  synopsis:
    "A lighthouse keeper on a dying coast picks up a signal from a shore that no longer exists — and decides to follow it.",
};

export const CONTINUE_WATCHING_TITLES: FixtureTitle[] = [
  { id: "the-long-afterlight", title: "The Long Afterlight", year: 2025, genre: "Science Fiction", progress: 0.35 },
  { id: "signal-zero", title: "Signal Zero", year: 2024, genre: "Thriller", progress: 0.62 },
  { id: "northern-frame", title: "Northern Frame", year: 2023, genre: "Drama", progress: 0.08 },
  { id: "last-horizon", title: "Last Horizon", year: 2025, genre: "Adventure", progress: 0.74 },
];

export const MOVIE_TITLES: FixtureTitle[] = [
  { id: "the-long-afterlight", title: "The Long Afterlight", year: 2025, genre: "Science Fiction", runtimeMinutes: 128 },
  { id: "signal-zero", title: "Signal Zero", year: 2024, genre: "Thriller", runtimeMinutes: 112 },
  { id: "northern-frame", title: "Northern Frame", year: 2023, genre: "Drama", runtimeMinutes: 104 },
  { id: "last-horizon", title: "Last Horizon", year: 2025, genre: "Adventure", runtimeMinutes: 131 },
  { id: "paper-lanterns", title: "Paper Lanterns", year: 2022, genre: "Drama", runtimeMinutes: 98 },
  { id: "ash-and-ember", title: "Ash and Ember", year: 2024, genre: "Crime", runtimeMinutes: 119 },
  { id: "the-slow-hours", title: "The Slow Hours", year: 2023, genre: "Mystery", runtimeMinutes: 106 },
  { id: "meridian", title: "Meridian", year: 2021, genre: "Science Fiction", runtimeMinutes: 115 },
];

export const SERIES_TITLES: FixtureTitle[] = [
  { id: "the-quiet-station", title: "The Quiet Station", year: 2024, genre: "Drama" },
  { id: "harbor-lights", title: "Harbor Lights", year: 2023, genre: "Crime" },
  { id: "static-coast", title: "Static Coast", year: 2025, genre: "Thriller" },
  { id: "the-cartographer", title: "The Cartographer", year: 2024, genre: "Animation" },
  { id: "second-moon", title: "Second Moon", year: 2025, genre: "Science Fiction" },
  { id: "field-notes", title: "Field Notes", year: 2023, genre: "Documentary" },
];

export interface FixtureCategory {
  id: string;
  label: string;
}

export const CATEGORIES: FixtureCategory[] = [
  { id: "action", label: "Action" },
  { id: "drama", label: "Drama" },
  { id: "comedy", label: "Comedy" },
  { id: "thriller", label: "Thriller" },
  { id: "sci-fi", label: "Sci-Fi" },
  { id: "animation", label: "Animation" },
  { id: "documentary", label: "Documentary" },
  { id: "crime", label: "Crime" },
];

export const LANDING_COPY = {
  eyebrow: "Zen-Stream",
  heroHeadline: "Your next story is already waiting.",
  heroSupport:
    "Discover movies and series worth your time. Keep your watchlist close, and pick up exactly where you left off.",
  primaryCta: "Explore movies",
  secondaryCta: "Explore series",
  featuredEyebrow: "Featured",
  continueEyebrow: "Continue watching",
  continueNote: "Demo preview — playback resumes later.",
  categoriesEyebrow: "Browse",
  categoriesTitle: "Browse by category",
  moviesEyebrow: "Discovery",
  moviesTitle: "Movies",
  seriesTitle: "Series",
  seeAll: "See all",
  previewEyebrow: "The experience",
  previewTitle: "Built for the screen",
  previewSupport:
    "A persistent shell that gets out of the way: collapse the sidebar, search from anywhere, and keep the player close.",
  finalEyebrow: "Ready when you are",
  finalTitle: "Start your next watch.",
  finalSupport: "Browse the catalog, save what you love, and pick up right where you left off.",
  footerStatement: "A discovery-first streaming experience for movies and series.",
  footerLegal: "Privacy · Terms — coming soon.",
} as const;