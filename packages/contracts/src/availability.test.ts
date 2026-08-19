import { describe, expect, it } from "vitest";
import {
  formatComingSoonLabel,
  formatMediaReleaseDate,
  getMediaActions,
  getMediaAvailability,
  parseMediaReleaseDate,
} from "./availability";

const NOW = new Date(Date.UTC(2026, 7, 18, 12, 0, 0));

describe("parseMediaReleaseDate", () => {
  it("parses date-only strings as UTC midnight", () => {
    expect(parseMediaReleaseDate("2026-08-28")?.toISOString()).toBe("2026-08-28T00:00:00.000Z");
  });

  it("tolerates full ISO timestamps and timezones", () => {
    expect(parseMediaReleaseDate("2026-08-28T15:30:00+02:00")?.toISOString()).toBe(
      "2026-08-28T00:00:00.000Z",
    );
  });

  it("returns null for missing, empty, and malformed values", () => {
    expect(parseMediaReleaseDate(null)).toBeNull();
    expect(parseMediaReleaseDate(undefined)).toBeNull();
    expect(parseMediaReleaseDate("")).toBeNull();
    expect(parseMediaReleaseDate("Aug 28, 2026")).toBeNull();
    expect(parseMediaReleaseDate("2026-13-40")).toBeNull();
    expect(parseMediaReleaseDate("not-a-date")).toBeNull();
  });
});

describe("getMediaAvailability", () => {
  const input = {
    releaseDate: "2026-08-28",
    hasResource: true,
  };

  it("is coming-soon for a future release date even with a resource listed", () => {
    expect(getMediaAvailability(input, NOW)).toBe("coming-soon");
  });

  it("is available on the release day itself", () => {
    expect(getMediaAvailability({ ...input, releaseDate: "2026-08-18" }, NOW)).toBe("available");
  });

  it("is available after the release date", () => {
    expect(getMediaAvailability({ ...input, releaseDate: "2026-08-01" }, NOW)).toBe("available");
  });

  it("falls back to the resource when the date is missing", () => {
    expect(getMediaAvailability({ releaseDate: null, hasResource: true }, NOW)).toBe("available");
    expect(getMediaAvailability({ releaseDate: null, hasResource: false }, NOW)).toBe(
      "unavailable",
    );
  });

  it("falls back to the resource when the date is malformed", () => {
    expect(getMediaAvailability({ releaseDate: "TBA", hasResource: true }, NOW)).toBe("available");
  });

  it("is preview-only when only a preview exists", () => {
    expect(
      getMediaAvailability({ releaseDate: "2026-08-01", hasResource: false, previewUrl: "https://x/preview" }, NOW),
    ).toBe("preview-only");
  });

  it("prefers availability over a preview for released titles", () => {
    expect(
      getMediaAvailability({ releaseDate: "2026-08-01", hasResource: true, previewUrl: "https://x/preview" }, NOW),
    ).toBe("available");
  });

  it("is unavailable when there is nothing at all", () => {
    expect(getMediaAvailability({ releaseDate: null, hasResource: false }, NOW)).toBe("unavailable");
  });
});

describe("getMediaActions", () => {
  const base = { releaseDate: null, hasResource: false };

  it("available: watch, save, share, details — no preview", () => {
    expect(getMediaActions({ ...base, hasResource: true }, NOW)).toEqual({
      watch: true,
      preview: false,
      save: true,
      share: true,
      details: true,
    });
  });

  it("coming-soon: no watch, preview only when a preview exists", () => {
    expect(getMediaActions({ ...base, releaseDate: "2026-08-28", hasResource: true }, NOW)).toEqual({
      watch: false,
      preview: false,
      save: true,
      share: true,
      details: true,
    });
    expect(
      getMediaActions(
        { ...base, releaseDate: "2026-08-28", hasResource: true, previewUrl: "https://x/preview" },
        NOW,
      ),
    ).toMatchObject({ preview: true, watch: false });
  });

  it("preview-only: preview, save, share, details — no watch", () => {
    expect(getMediaActions({ ...base, previewUrl: "https://x/preview" }, NOW)).toEqual({
      watch: false,
      preview: true,
      save: true,
      share: true,
      details: true,
    });
  });

  it("unavailable: save, share, details — preview only when one exists", () => {
    expect(getMediaActions(base, NOW)).toEqual({
      watch: false,
      preview: false,
      save: true,
      share: true,
      details: true,
    });
  });
});

describe("formatMediaReleaseDate", () => {
  it("formats short and full dates in UTC", () => {
    expect(formatMediaReleaseDate("2026-08-28")).toBe("Aug 28");
    expect(formatMediaReleaseDate("2026-08-28", { year: true })).toBe("Aug 28, 2026");
  });

  it("returns null for unknown dates", () => {
    expect(formatMediaReleaseDate(null)).toBeNull();
    expect(formatMediaReleaseDate("garbage")).toBeNull();
  });
});

describe("formatComingSoonLabel", () => {
  it("builds the label from a release date", () => {
    expect(formatComingSoonLabel("2026-08-28")).toBe("Coming Aug 28");
    expect(formatComingSoonLabel("2026-08-28", { year: true })).toBe("Coming Aug 28, 2026");
  });

  it("returns null when the date is unknown", () => {
    expect(formatComingSoonLabel(null)).toBeNull();
  });
});