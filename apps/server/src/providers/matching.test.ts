import { describe, expect, it } from "vitest";
import type { MediaSearchItem } from "@zen-stream/contracts";
import { dedupeSearchItems, normalizeTitle, searchItemDedupKey } from "./matching.js";

function item(subjectId: string, title: string, type: "movie" | "series" = "movie"): MediaSearchItem {
  return {
    subjectId,
    type,
    title,
    releaseDate: null,
    duration: null,
    genre: null,
    poster: null,
    rating: null,
    language: null,
    country: null,
  };
}

describe("normalizeTitle", () => {
  it("lowercases and collapses whitespace", () => {
    expect(normalizeTitle("  THE   MATRIX  ")).toBe("the matrix");
  });

  it("strips bracketed release tags", () => {
    expect(normalizeTitle("Avatar [Hindi]")).toBe("avatar");
    expect(normalizeTitle("Spider-Man [CAM][HD]")).toBe("spider man");
  });

  it("strips punctuation and keeps unicode letters", () => {
    expect(normalizeTitle("Mad Max: Fury Road (2024)")).toBe("mad max fury road 2024");
    expect(normalizeTitle("神探大战")).toBe("神探大战");
  });
});

describe("searchItemDedupKey", () => {
  it("keys on normalized title and type", () => {
    expect(searchItemDedupKey(item("a", "Fight Club"))).toBe(searchItemDedupKey(item("b", "fight   club")));
    expect(searchItemDedupKey(item("a", "Fight Club"))).not.toBe(
      searchItemDedupKey(item("a", "Fight Club 2")),
    );
    expect(searchItemDedupKey(item("a", "Fight Club", "movie"))).not.toBe(
      searchItemDedupKey(item("b", "Fight Club", "series")),
    );
  });
});

describe("dedupeSearchItems", () => {
  it("keeps an exact duplicate once (first occurrence wins)", () => {
    const items = [
      item("the-matrix-387273", "The Matrix"),
      item("NjA1NTczMTE5ODc3MTM4NDk3Njo6OnBpY2E", "The Matrix"),
    ];

    const unique = dedupeSearchItems(items);

    expect(unique).toHaveLength(1);
    expect(unique[0]?.subjectId).toBe("the-matrix-387273");
  });

  it("keeps genuinely different titles", () => {
    const items = [
      item("the-matrix-387273", "The Matrix"),
      item("the-matrix-reloaded-958850", "The Matrix Reloaded"),
      item("fight-club-828920", "Fight Club"),
    ];

    expect(dedupeSearchItems(items)).toHaveLength(3);
  });

  it("does not merge movie and series with the same title", () => {
    const items = [item("movie-a", "The Boys", "movie"), item("series-b", "The Boys", "series")];

    expect(dedupeSearchItems(items)).toHaveLength(2);
  });

  it("returns an empty array for no items", () => {
    expect(dedupeSearchItems([])).toEqual([]);
  });
});