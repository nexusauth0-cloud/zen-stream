import { describe, expect, it } from "vitest";
import {
  HOME_COPY,
  HOME_FEED,
  HOME_FEED_SECTIONS,
  HERO_FEED_ITEM,
  MOOD_BY_GENRE,
  MOVIE_TITLES,
  SERIES_TITLES,
} from "./fixtures";
import type { ArtMood, FeedSectionKind, FeedTitle } from "./fixtures";

const VALID_KINDS = new Set<FeedSectionKind>([
  "trending",
  "movie-rail",
  "series-rail",
  "genre-rail",
  "continue-rail",
  "new-releases",
]);

const VALID_MOODS = new Set<ArtMood>(["amber", "steel", "crimson", "emerald", "violet", "ivory"]);

const ALL_TITLES: FeedTitle[] = [
  HERO_FEED_ITEM,
  ...HOME_FEED_SECTIONS.flatMap((section) => section.items),
];

describe("home feed fixtures", () => {
  it("mirrors the future feed contract shape", () => {
    expect(HOME_FEED.hero).toEqual(HERO_FEED_ITEM);
    expect(HOME_FEED.sections).toBe(HOME_FEED_SECTIONS);
    expect(HOME_FEED.nextCursor).toBeNull();
  });

  it("has well-formed sections with unique ids and non-empty items", () => {
    const ids = new Set<string>();
    for (const section of HOME_FEED_SECTIONS) {
      expect(ids.has(section.id)).toBe(false);
      ids.add(section.id);
      expect(VALID_KINDS.has(section.kind)).toBe(true);
      expect(section.items.length).toBeGreaterThan(0);
    }
  });

  it("uses unique title ids within each section", () => {
    for (const section of HOME_FEED_SECTIONS) {
      const ids = new Set<string>();
      for (const title of section.items) {
        expect(ids.has(title.id)).toBe(false);
        ids.add(title.id);
      }
    }
  });

  it("gives every title valid metadata and artwork mood", () => {
    for (const title of ALL_TITLES) {
      expect(title.title.length).toBeGreaterThan(0);
      expect(title.year).toBeGreaterThan(1900);
      expect(title.genre.length).toBeGreaterThan(0);
      expect(["movie", "series"]).toContain(title.kind);
      expect(VALID_MOODS.has(title.artMood)).toBe(true);
    }
  });

  it("derives the artwork mood from the genre map", () => {
    for (const title of ALL_TITLES) {
      expect(title.artMood).toBe(MOOD_BY_GENRE[title.genre] ?? "amber");
    }
  });

  it("keeps continue-watching progress strictly inside the playable range", () => {
    const continueRail = HOME_FEED_SECTIONS.find((section) => section.kind === "continue-rail")!;
    expect(continueRail.items.length).toBeGreaterThan(0);
    for (const title of continueRail.items) {
      expect(title.progress).toBeGreaterThan(0);
      expect(title.progress).toBeLessThan(1);
    }
  });

  it("never fabricates statistics or availability claims", () => {
    for (const title of ALL_TITLES) {
      expect(title).not.toHaveProperty("rating");
      expect(title).not.toHaveProperty("views");
      expect(title).not.toHaveProperty("rank");
      expect(title).not.toHaveProperty("popularity");
      expect(title).not.toHaveProperty("availableUntil");
      expect(title).not.toHaveProperty("licenses");
    }
  });

  it("contains no remote URLs", () => {
    const serialized = JSON.stringify(HOME_FEED);
    expect(serialized).not.toMatch(/https?:\/\//);
  });

  it("is deterministic", () => {
    const first = JSON.stringify(HOME_FEED);
    const second = JSON.stringify(HOME_FEED);
    expect(second).toBe(first);
  });

  it("keeps flat lists consistent with kinds", () => {
    expect(MOVIE_TITLES.length).toBeGreaterThan(0);
    expect(SERIES_TITLES.length).toBeGreaterThan(0);
    for (const title of MOVIE_TITLES) {
      expect(title.kind).toBe("movie");
    }
    for (const title of SERIES_TITLES) {
      expect(title.kind).toBe("series");
    }
  });

  it("exposes the copy used by the UI", () => {
    expect(HOME_COPY.watch).toBe("Watch");
    expect(HOME_COPY.searchPlaceholder).toBe("Search movies and series");
    expect(HOME_COPY.seeAll).toBe("See all");
  });
});