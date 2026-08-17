import { describe, expect, it } from "vitest";
import type { MediaHomeFeed } from "@zen-stream/contracts";
import { HERO_TITLE_LIMIT, heroCandidates, selectHeroTitles, shuffle } from "./heroCarousel";

function subject(id: string, overrides: Partial<MediaHomeFeed["rows"][number]["subjects"][number]> = {}) {
  return {
    subjectId: id,
    type: "movie" as const,
    title: `Title ${id}`,
    poster: `https://cdn.example/${id}.jpg`,
    hasResource: true,
    description: null as string | null,
    releaseDate: null,
    runtime: null,
    genre: null,
    rating: null,
    language: null,
    country: null,
    ...overrides,
  };
}

function feedWith(subjects: ReturnType<typeof subject>[][], extraRows = 0): MediaHomeFeed {
  const rows: MediaHomeFeed["rows"] = subjects.map((items, index) => ({
    title: `Row ${index}`,
    opId: `op-${index}`,
    type: null,
    total: items.length,
    subjects: items,
  }));
  for (let i = 0; i < extraRows; i += 1) {
    rows.push({
      title: `Empty ${i}`,
      opId: `empty-${i}`,
      type: "CUSTOM",
      total: 0,
      subjects: [] as ReturnType<typeof subject>[],
    });
  }
  return { total: rows.length, rows };
}

const seeded = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

describe("heroCandidates", () => {
  it("keeps only real titles with artwork and an available resource", () => {
    const feed = feedWith([
      [
        subject("a"),
        subject("b", { poster: null }),
        subject("c", { hasResource: false }),
        subject("d", { title: "  " }),
      ],
    ]);

    const candidates = heroCandidates(feed);

    expect(candidates.map((item) => item.subjectId)).toEqual(["a"]);
  });

  it("deduplicates subjects repeated across feed rows", () => {
    const feed = feedWith([
      [subject("a"), subject("b")],
      [subject("b"), subject("c")],
    ]);

    expect(heroCandidates(feed)).toHaveLength(3);
  });

  it("skips structural rows without subjects", () => {
    const feed = feedWith([[subject("a")]], 3);

    expect(heroCandidates(feed)).toHaveLength(1);
  });
});

describe("selectHeroTitles", () => {
  it("never contains duplicate subject ids", () => {
    const feed = feedWith([
      [subject("a"), subject("b"), subject("c"), subject("a"), subject("d")],
      [subject("b"), subject("e"), subject("f")],
    ]);

    const titles = selectHeroTitles(feed, seeded(42));
    const ids = titles.map((item) => item.subjectId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("caps the rotation at the featured limit", () => {
    const feed = feedWith([Array.from({ length: 40 }, (_, index) => subject(`s${index}`))]);

    expect(selectHeroTitles(feed, seeded(1))).toHaveLength(HERO_TITLE_LIMIT);
  });

  it("returns a different order for different seeds", () => {
    const feed = feedWith([Array.from({ length: 20 }, (_, index) => subject(`s${index}`))]);

    const first = selectHeroTitles(feed, seeded(7));
    const second = selectHeroTitles(feed, seeded(8));

    expect(first[0]!.subjectId).not.toBe(second[0]!.subjectId);
  });

  it("is deterministic for the same seed", () => {
    const feed = feedWith([Array.from({ length: 20 }, (_, index) => subject(`s${index}`))]);

    expect(selectHeroTitles(feed, seeded(99))).toEqual(selectHeroTitles(feed, seeded(99)));
  });

  it("returns an empty rotation when nothing is eligible", () => {
    const feed = feedWith([[subject("a", { poster: null })]]);

    expect(selectHeroTitles(feed, seeded(5))).toEqual([]);
  });
});

describe("shuffle", () => {
  it("preserves the item set", () => {
    const source = [1, 2, 3, 4, 5];
    const result = shuffle(source, seeded(3));

    expect([...result].sort()).toEqual([...source].sort());
    expect(result).not.toBe(source);
  });
});
