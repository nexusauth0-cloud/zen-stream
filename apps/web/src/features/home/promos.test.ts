import { describe, expect, it } from "vitest";
import type { MediaHomeFeed } from "@zen-stream/contracts";
import { MAX_PROMOS, interleavePromos, promoSlots } from "./promos";
import type { HomeFeedEntry } from "./promos";

const row = (opId: string): MediaHomeFeed["rows"][number] => ({
  title: opId,
  opId,
  type: "SUBJECTS_MOVIE",
  total: 1,
  subjects: [
    {
      subjectId: `s-${opId}`,
      type: "movie",
      title: opId,
      poster: null,
      hasResource: true,
      description: null,
      releaseDate: null,
      runtime: null,
      genre: null,
      rating: null,
      language: null,
      country: null,
    },
  ],
});

describe("promoSlots", () => {
  it("places no promo on the first rail (right after the hero)", () => {
    for (let seed = 0; seed < 50; seed += 1) {
      expect(promoSlots(12, seed)).not.toContain(0);
    }
  });

  it("keeps promos at least one rail apart", () => {
    for (let seed = 0; seed < 50; seed += 1) {
      const slots = promoSlots(12, seed);
      slots.forEach((slot, index) => {
        if (index > 0) expect(slot - slots[index - 1]!).toBeGreaterThanOrEqual(2);
      });
    }
  });

  it("caps the number of placements at MAX_PROMOS", () => {
    expect(promoSlots(40, 1)).toHaveLength(MAX_PROMOS);
    expect(promoSlots(40, 1).length).toBeLessThanOrEqual(3);
  });

  it("never places promos next to each other", () => {
    const slots = promoSlots(40, 1);
    expect(slots[0]!).toBeGreaterThanOrEqual(1);
  });

  it("returns no slots for tiny feeds", () => {
    expect(promoSlots(0, 1)).toEqual([]);
    expect(promoSlots(1, 1)).toEqual([]);
    expect(promoSlots(2, 1)).toEqual([]);
  });

  it("is deterministic for the same seed and differs across seeds", () => {
    expect(promoSlots(12, 42)).toEqual(promoSlots(12, 42));
    expect(promoSlots(12, 3)).not.toEqual(promoSlots(12, 4));
  });

  it("stays within the feed bounds", () => {
    for (let seed = 0; seed < 30; seed += 1) {
      const slots = promoSlots(10, seed);
      slots.forEach((slot) => expect(slot).toBeLessThan(10));
    }
  });
});

describe("interleavePromos", () => {
  it("inserts promos between rails in order", () => {
    const rows = [row("a"), row("b"), row("c"), row("d"), row("e"), row("f")];
    const entries = interleavePromos(rows, [1, 4]);

    expect(entries.map((entry) => entry.key)).toEqual([
      "a",
      "promo-1",
      "b",
      "c",
      "d",
      "promo-4",
      "e",
      "f",
    ]);
  });

  it("assigns each promo a distinct variant", () => {
    const rows = [row("a"), row("b"), row("c"), row("d"), row("e"), row("f"), row("g"), row("h")];
    const entries = interleavePromos(rows, promoSlots(8, 1));
    const variants = entries
      .filter((entry): entry is Extract<HomeFeedEntry, { promo: true }> => entry.promo === true)
      .map((entry) => entry.variant);

    expect(variants).toEqual([0, 1, 2]);
  });

  it("keeps every rail even when no promos are placed", () => {
    const rows = [row("a"), row("b")];
    expect(interleavePromos(rows, []).map((entry) => entry.key)).toEqual(["a", "b"]);
  });
});
