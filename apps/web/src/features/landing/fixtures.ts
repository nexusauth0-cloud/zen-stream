/**
 * PRESENTATION-ONLY FEED FIXTURES.
 *
 * There is no catalog backend yet. Everything here is deterministic, locally
 * defined development content used to demonstrate the streaming homepage.
 *
 * Deliberately absent:
 * - user counts, watch counts, ratings, popularity or ranking numbers
 * - licensing or availability claims
 * - any remote or copyrighted artwork URLs (artwork is procedural)
 *
 * MODEL COMPATIBILITY:
 * The shape mirrors the future home-feed contract:
 *
 *   { hero, sections: [{ id, title, kind, genre?, items }], nextCursor }
 *
 * A backend (M4/M5) can replace HOME_FEED without rewriting the UI.
 */

export type FeedTitleKind = "movie" | "series";

export interface FeedTitle {
  id: string;
  title: string;
  year: number;
  genre: string;
  kind: FeedTitleKind;
  /** Movie runtime in minutes. */
  runtimeMinutes?: number;
  synopsis?: string;
  /** Demo-only resume position 0..1 — never derived from real user history. */
  progress?: number;
  /** Artwork color grading hint (see CinematicArt moods). */
  artMood: ArtMood;
}

export type ArtMood = "amber" | "steel" | "crimson" | "emerald" | "violet" | "ivory";

export type FeedSectionKind =
  | "trending"
  | "movie-rail"
  | "series-rail"
  | "genre-rail"
  | "continue-rail"
  | "new-releases";

export interface FeedSection {
  id: string;
  title: string;
  kind: FeedSectionKind;
  /** Genre identifier for genre rails; reserved for future `?genre=` queries. */
  genre?: string;
  subtitle?: string;
  items: FeedTitle[];
}

export interface HomeFeed {
  hero: FeedTitle;
  sections: FeedSection[];
  nextCursor: null;
}

export const MOOD_BY_GENRE: Record<string, ArtMood> = {
  "Action & Thriller": "steel",
  Comedy: "ivory",
  Drama: "amber",
  "Science Fiction": "violet",
  Romance: "ivory",
  Horror: "crimson",
  Animation: "amber",
  Documentary: "amber",
  Crime: "steel",
  Mystery: "steel",
  Fantasy: "violet",
  Adventure: "amber",
};

function moodFor(genre: string): ArtMood {
  return MOOD_BY_GENRE[genre] ?? "amber";
}

function t(
  id: string,
  title: string,
  year: number,
  genre: string,
  kind: FeedTitleKind,
  extra?: Partial<FeedTitle>,
): FeedTitle {
  return { id, title, year, genre, kind, artMood: moodFor(genre), ...extra };
}

/* ── Titles (original fictional fixtures) ────────────────────────────── */

const ACTION: FeedTitle[] = [
  t("night-convoy", "Night Convoy", 2024, "Action & Thriller", "movie", { runtimeMinutes: 106 }),
  t("redline-district", "Redline District", 2022, "Action & Thriller", "movie", { runtimeMinutes: 112 }),
  t("zero-hour", "Zero Hour", 2023, "Action & Thriller", "movie", { runtimeMinutes: 104 }),
  t("the-last-intercept", "The Last Intercept", 2021, "Action & Thriller", "movie", { runtimeMinutes: 118 }),
  t("blackout-mile", "Blackout Mile", 2024, "Action & Thriller", "movie", { runtimeMinutes: 101 }),
  t("iron-tide", "Iron Tide", 2023, "Action & Thriller", "movie", { runtimeMinutes: 124 }),
  t("counter-motion", "Counter-Motion", 2022, "Action & Thriller", "movie", { runtimeMinutes: 109 }),
  t("frozen-proof", "Frozen Proof", 2025, "Action & Thriller", "movie", { runtimeMinutes: 115 }),
];

const COMEDY: FeedTitle[] = [
  t("the-wrong-apartment", "The Wrong Apartment", 2023, "Comedy", "movie", { runtimeMinutes: 96 }),
  t("catering-chaos", "Catering Chaos", 2022, "Comedy", "movie", { runtimeMinutes: 92 }),
  t("second-serve", "Second Serve", 2024, "Comedy", "movie", { runtimeMinutes: 99 }),
  t("office-orbit", "Office Orbit", 2021, "Comedy", "movie", { runtimeMinutes: 95 }),
  t("the-long-weekend", "The Long Weekend", 2023, "Comedy", "movie", { runtimeMinutes: 103 }),
  t("table-for-two", "Table for Two", 2022, "Comedy", "movie", { runtimeMinutes: 94 }),
  t("the-interview-free-zone", "The Interview-Free Zone", 2024, "Comedy", "movie", { runtimeMinutes: 97 }),
  t("neighborly", "Neighborly", 2021, "Comedy", "movie", { runtimeMinutes: 90 }),
  t("the-audition", "The Audition", 2025, "Comedy", "movie", { runtimeMinutes: 101 }),
  t("drum-roll", "Drum Roll", 2023, "Comedy", "movie", { runtimeMinutes: 93 }),
];

const DRAMA: FeedTitle[] = [
  t("northern-frame", "Northern Frame", 2023, "Drama", "movie", { runtimeMinutes: 104 }),
  t("the-slow-hours", "The Slow Hours", 2023, "Drama", "movie", { runtimeMinutes: 106 }),
  t("paper-lanterns", "Paper Lanterns", 2022, "Drama", "movie", { runtimeMinutes: 98 }),
  t("quiet-orchard", "Quiet Orchard", 2021, "Drama", "movie", { runtimeMinutes: 111 }),
  t("the-glasshouse", "The Glasshouse", 2024, "Drama", "movie", { runtimeMinutes: 107 }),
  t("after-the-harvest", "After the Harvest", 2022, "Drama", "movie", { runtimeMinutes: 99 }),
  t("a-winters-letter", "A Winter's Letter", 2023, "Drama", "movie", { runtimeMinutes: 102 }),
  t("half-past-june", "Half Past June", 2024, "Drama", "movie", { runtimeMinutes: 105 }),
  t("the-salt-road", "The Salt Road", 2021, "Drama", "movie", { runtimeMinutes: 113 }),
  t("names-in-the-rain", "Names in the Rain", 2025, "Drama", "movie", { runtimeMinutes: 108 }),
];

const SCI_FI: FeedTitle[] = [
  t("the-long-afterlight", "The Long Afterlight", 2025, "Science Fiction", "movie", {
    runtimeMinutes: 128,
    synopsis:
      "A lighthouse keeper on a dying coast picks up a signal from a shore that no longer exists — and decides to follow it.",
  }),
  t("meridian", "Meridian", 2021, "Science Fiction", "movie", { runtimeMinutes: 115 }),
  t("second-moon", "Second Moon", 2025, "Science Fiction", "series"),
  t("orbital-decay", "Orbital Decay", 2023, "Science Fiction", "movie", { runtimeMinutes: 121 }),
  t("the-sleep-station", "The Sleep Station", 2022, "Science Fiction", "series"),
  t("vast", "Vast", 2024, "Science Fiction", "movie", { runtimeMinutes: 132 }),
  t("terra-incognita", "Terra Incognita", 2023, "Science Fiction", "series"),
  t("signal-fade", "Signal Fade", 2022, "Science Fiction", "movie", { runtimeMinutes: 110 }),
  t("the-ninth-sky", "The Ninth Sky", 2024, "Science Fiction", "series"),
  t("echoes-beyond", "Echoes Beyond", 2025, "Science Fiction", "movie", { runtimeMinutes: 119 }),
];

const ROMANCE: FeedTitle[] = [
  t("slow-match", "Slow Match", 2023, "Romance", "movie", { runtimeMinutes: 97 }),
  t("the-postcard-year", "The Postcard Year", 2022, "Romance", "movie", { runtimeMinutes: 101 }),
  t("blue-hour", "Blue Hour", 2025, "Romance", "movie", { runtimeMinutes: 99 }),
  t("someone-elses-summer", "Someone Else's Summer", 2021, "Romance", "movie", { runtimeMinutes: 96 }),
  t("the-distance-between", "The Distance Between", 2023, "Romance", "movie", { runtimeMinutes: 105 }),
  t("first-train-home", "First Train Home", 2022, "Romance", "movie", { runtimeMinutes: 94 }),
  t("paper-hearts", "Paper Hearts", 2024, "Romance", "movie", { runtimeMinutes: 98 }),
  t("a-song-for-tuesday", "A Song for Tuesday", 2021, "Romance", "movie", { runtimeMinutes: 102 }),
  t("the-lantern-season", "The Lantern Season", 2023, "Romance", "series"),
  t("rewrite", "Rewrite", 2025, "Romance", "movie", { runtimeMinutes: 100 }),
];

const HORROR: FeedTitle[] = [
  t("the-hollow-floor", "The Hollow Floor", 2025, "Horror", "movie", { runtimeMinutes: 108 }),
  t("whisper-house", "Whisper House", 2022, "Horror", "movie", { runtimeMinutes: 97 }),
  t("grain", "Grain", 2023, "Horror", "movie", { runtimeMinutes: 94 }),
  t("the-long-corridor", "The Long Corridor", 2021, "Horror", "movie", { runtimeMinutes: 91 }),
  t("static-in-the-attic", "Static in the Attic", 2024, "Horror", "series"),
  t("night-harvest", "Night Harvest", 2022, "Horror", "movie", { runtimeMinutes: 103 }),
  t("the-mirror-room", "The Mirror Room", 2023, "Horror", "movie", { runtimeMinutes: 96 }),
  t("silent-rot", "Silent Rot", 2021, "Horror", "movie", { runtimeMinutes: 92 }),
  t("vigil", "Vigil", 2024, "Horror", "movie", { runtimeMinutes: 105 }),
  t("the-pale-visitor", "The Pale Visitor", 2025, "Horror", "series"),
];

const ANIMATION: FeedTitle[] = [
  t("the-cartographer", "The Cartographer", 2024, "Animation", "series"),
  t("little-comets", "Little Comets", 2025, "Animation", "movie", { runtimeMinutes: 89 }),
  t("the-fox-and-the-foundling", "The Fox and the Foundling", 2023, "Animation", "movie", { runtimeMinutes: 86 }),
  t("clockwork-garden", "Clockwork Garden", 2022, "Animation", "series"),
  t("moon-ferry", "Moon Ferry", 2024, "Animation", "movie", { runtimeMinutes: 92 }),
  t("the-last-kite", "The Last Kite", 2021, "Animation", "movie", { runtimeMinutes: 84 }),
  t("sable-and-pine", "Sable & Pine", 2023, "Animation", "series"),
  t("the-cloud-weaver", "The Cloud Weaver", 2025, "Animation", "movie", { runtimeMinutes: 90 }),
  t("tiny-giants", "Tiny Giants", 2022, "Animation", "series"),
  t("rust-and-honey", "Rust & Honey", 2024, "Animation", "movie", { runtimeMinutes: 88 }),
];

const DOCUMENTARY: FeedTitle[] = [
  t("field-notes", "Field Notes", 2023, "Documentary", "series"),
  t("the-quiet-market", "The Quiet Market", 2022, "Documentary", "movie", { runtimeMinutes: 82 }),
  t("salt-and-stone", "Salt and Stone", 2021, "Documentary", "movie", { runtimeMinutes: 88 }),
  t("the-last-paper-route", "The Last Paper Route", 2024, "Documentary", "movie", { runtimeMinutes: 79 }),
  t("craft-and-ember", "Craft & Ember", 2023, "Documentary", "series"),
  t("deep-currents", "Deep Currents", 2022, "Documentary", "movie", { runtimeMinutes: 91 }),
  t("the-handmade-world", "The Handmade World", 2024, "Documentary", "series"),
  t("town-without-a-cinema", "Town Without a Cinema", 2025, "Documentary", "movie", { runtimeMinutes: 94 }),
];

const CRIME: FeedTitle[] = [
  t("ash-and-ember", "Ash and Ember", 2024, "Crime", "movie", { runtimeMinutes: 119 }),
  t("harbor-lights", "Harbor Lights", 2023, "Crime", "series"),
  t("the-ledger", "The Ledger", 2025, "Crime", "series"),
  t("black-marble", "Black Marble", 2022, "Crime", "movie", { runtimeMinutes: 117 }),
  t("second-opinion", "Second Opinion", 2021, "Crime", "movie", { runtimeMinutes: 108 }),
  t("late-shift", "Late Shift", 2024, "Crime", "series"),
  t("the-collectors-debt", "The Collector's Debt", 2023, "Crime", "movie", { runtimeMinutes: 111 }),
  t("dead-letter-office", "Dead Letter Office", 2025, "Crime", "series"),
];

const FANTASY: FeedTitle[] = [
  t("emberwood", "Emberwood", 2025, "Fantasy", "movie", { runtimeMinutes: 134 }),
  t("the-sunken-crown", "The Sunken Crown", 2023, "Fantasy", "movie", { runtimeMinutes: 127 }),
  t("wren-and-the-wild", "Wren & the Wild", 2022, "Fantasy", "movie", { runtimeMinutes: 109 }),
  t("lantern-king", "Lantern King", 2024, "Fantasy", "series"),
  t("a-crown-of-salt", "A Crown of Salt", 2021, "Fantasy", "movie", { runtimeMinutes: 121 }),
  t("the-dreaming-coast", "The Dreaming Coast", 2023, "Fantasy", "series"),
  t("seven-sigils", "Seven Sigils", 2025, "Fantasy", "series"),
  t("the-hollow-kingdom", "The Hollow Kingdom", 2022, "Fantasy", "movie", { runtimeMinutes: 116 }),
];

const SERIES_DRAMA: FeedTitle[] = [
  t("the-quiet-station", "The Quiet Station", 2024, "Drama", "series"),
  t("static-coast", "Static Coast", 2025, "Action & Thriller", "series"),
];

const ADVENTURE: FeedTitle[] = [
  t("last-horizon", "Last Horizon", 2025, "Adventure", "movie", { runtimeMinutes: 131 }),
];

/* ── Feed ─────────────────────────────────────────────────────────────── */

export const HERO_FEED_ITEM: FeedTitle = {
  id: "the-long-afterlight",
  title: "The Long Afterlight",
  year: 2025,
  genre: "Science Fiction",
  kind: "movie",
  runtimeMinutes: 128,
  artMood: "violet",
  synopsis:
    "A lighthouse keeper on a dying coast picks up a signal from a shore that no longer exists — and decides to follow it.",
};

/** Flat lists kept for secondary surfaces (e.g. ProductPreview). */
export const MOVIE_TITLES: FeedTitle[] = [
  ...ACTION,
  ...COMEDY,
  ...DRAMA,
  ...SCI_FI.filter((title) => title.kind === "movie"),
  ...ROMANCE.filter((title) => title.kind === "movie"),
  ...HORROR.filter((title) => title.kind === "movie"),
  ...ANIMATION.filter((title) => title.kind === "movie"),
  ...DOCUMENTARY.filter((title) => title.kind === "movie"),
  ...CRIME.filter((title) => title.kind === "movie"),
  ...FANTASY.filter((title) => title.kind === "movie"),
  ...ADVENTURE,
];

export const SERIES_TITLES: FeedTitle[] = [
  ...SERIES_DRAMA,
  ...SCI_FI.filter((s) => s.kind === "series"),
  ...HORROR.filter((s) => s.kind === "series"),
  ...ANIMATION.filter((s) => s.kind === "series"),
  ...DOCUMENTARY.filter((s) => s.kind === "series"),
  ...CRIME.filter((s) => s.kind === "series"),
  ...FANTASY.filter((s) => s.kind === "series"),
];

const TRENDING: FeedTitle[] = [
  HERO_FEED_ITEM,
  ...ACTION.slice(0, 1),
  t("paper-lanterns", "Paper Lanterns", 2022, "Drama", "movie", { runtimeMinutes: 98 }),
  t("harbor-lights", "Harbor Lights", 2023, "Crime", "series"),
  t("meridian", "Meridian", 2021, "Science Fiction", "movie", { runtimeMinutes: 115 }),
  t("emberwood", "Emberwood", 2025, "Fantasy", "movie", { runtimeMinutes: 134 }),
  t("vast", "Vast", 2024, "Science Fiction", "movie", { runtimeMinutes: 132 }),
  t("whisper-house", "Whisper House", 2022, "Horror", "movie", { runtimeMinutes: 97 }),
];

const CONTINUE_WATCHING: FeedTitle[] = [
  { ...HERO_FEED_ITEM, progress: 0.35 },
  t("signal-zero", "Signal Zero", 2024, "Action & Thriller", "movie", { runtimeMinutes: 112, progress: 0.62 }),
  t("northern-frame", "Northern Frame", 2023, "Drama", "movie", { runtimeMinutes: 104, progress: 0.08 }),
  t("last-horizon", "Last Horizon", 2025, "Adventure", "movie", { runtimeMinutes: 131, progress: 0.74 }),
  t("harbor-lights", "Harbor Lights", 2023, "Crime", "series", { progress: 0.21 }),
  t("the-slow-hours", "The Slow Hours", 2023, "Drama", "movie", { runtimeMinutes: 106, progress: 0.46 }),
];

const NEW_RELEASES: FeedTitle[] = [
  t("last-horizon", "Last Horizon", 2025, "Adventure", "movie", { runtimeMinutes: 131 }),
  t("static-coast", "Static Coast", 2025, "Action & Thriller", "series"),
  t("second-moon", "Second Moon", 2025, "Science Fiction", "series"),
  t("night-convoy", "Night Convoy", 2024, "Action & Thriller", "movie", { runtimeMinutes: 106 }),
  t("emberwood", "Emberwood", 2025, "Fantasy", "movie", { runtimeMinutes: 134 }),
  t("vast", "Vast", 2024, "Science Fiction", "movie", { runtimeMinutes: 132 }),
  t("blue-hour", "Blue Hour", 2025, "Romance", "movie", { runtimeMinutes: 99 }),
  t("the-hollow-floor", "The Hollow Floor", 2025, "Horror", "movie", { runtimeMinutes: 108 }),
  t("little-comets", "Little Comets", 2025, "Animation", "movie", { runtimeMinutes: 89 }),
  t("the-ledger", "The Ledger", 2025, "Crime", "series"),
];

export const HOME_FEED_SECTIONS: FeedSection[] = [
  { id: "trending", title: "Trending", kind: "trending", items: TRENDING },
  { id: "popular-movies", title: "Popular Movies", kind: "movie-rail", items: [...SCI_FI, ...ACTION, ...DRAMA].slice(0, 10) },
  {
    id: "popular-series",
    title: "Popular Series",
    kind: "series-rail",
    items: [...SERIES_TITLES].slice(0, 10),
  },
  {
    id: "continue-watching",
    title: "Continue watching",
    kind: "continue-rail",
    subtitle: "Demo preview — playback resumes later.",
    items: CONTINUE_WATCHING,
  },
  { id: "action-thriller", title: "Action & Thriller", kind: "genre-rail", genre: "action-thriller", items: ACTION },
  { id: "comedy", title: "Comedy", kind: "genre-rail", genre: "comedy", items: COMEDY },
  { id: "drama", title: "Drama", kind: "genre-rail", genre: "drama", items: DRAMA },
  { id: "sci-fi", title: "Science Fiction", kind: "genre-rail", genre: "science-fiction", items: SCI_FI },
  { id: "romance", title: "Romance", kind: "genre-rail", genre: "romance", items: ROMANCE },
  { id: "horror", title: "Horror", kind: "genre-rail", genre: "horror", items: HORROR },
  { id: "animation", title: "Animation", kind: "genre-rail", genre: "animation", items: ANIMATION },
  { id: "new-releases", title: "New Releases", kind: "new-releases", items: NEW_RELEASES },
  { id: "crime-mystery", title: "Crime & Mystery", kind: "genre-rail", genre: "crime", items: CRIME },
  { id: "documentaries", title: "Documentaries", kind: "genre-rail", genre: "documentary", items: DOCUMENTARY },
  { id: "fantasy", title: "Fantasy Worlds", kind: "genre-rail", genre: "fantasy", items: FANTASY },
  {
    id: "weekend-discoveries",
    title: "Weekend Discoveries",
    kind: "genre-rail",
    subtitle: "A little bit of everything.",
    items: [
      t("the-fox-and-the-foundling", "The Fox and the Foundling", 2023, "Animation", "movie", { runtimeMinutes: 86 }),
      t("moon-ferry", "Moon Ferry", 2024, "Animation", "movie", { runtimeMinutes: 92 }),
      t("grain", "Grain", 2023, "Horror", "movie", { runtimeMinutes: 94 }),
      t("deep-currents", "Deep Currents", 2022, "Documentary", "movie", { runtimeMinutes: 91 }),
      t("the-postcard-year", "The Postcard Year", 2022, "Romance", "movie", { runtimeMinutes: 101 }),
      t("office-orbit", "Office Orbit", 2021, "Comedy", "movie", { runtimeMinutes: 95 }),
      t("vigil", "Vigil", 2024, "Horror", "movie", { runtimeMinutes: 105 }),
      t("rust-and-honey", "Rust & Honey", 2024, "Animation", "movie", { runtimeMinutes: 88 }),
    ],
  },
];

export const HOME_FEED: HomeFeed = {
  hero: HERO_FEED_ITEM,
  sections: HOME_FEED_SECTIONS,
  nextCursor: null,
};

export const HOME_COPY = {
  featured: "Featured",
  watch: "Watch",
  moreInfo: "More info",
  searchPlaceholder: "Search movies and series",
  seeAll: "See all",
  footerStatement: "A discovery-first streaming experience for movies and series.",
  footerLegal: "Privacy · Terms — coming soon.",
  previewEyebrow: "The experience",
  previewTitle: "Built for the screen",
  previewSupport:
    "A persistent shell that gets out of the way: collapse the sidebar, search from anywhere, and keep the player close.",
} as const;

/** Compatibility alias for secondary surfaces. */
export const FEATURED_TITLE: FeedTitle = HERO_FEED_ITEM;
export const LANDING_COPY = HOME_COPY;