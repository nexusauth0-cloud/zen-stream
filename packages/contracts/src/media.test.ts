import { describe, expect, it } from "vitest";
import {
  homeFeedSchema,
  homeRowsSchema,
  homeSubjectsSchema,
  infoResponseSchema,
  mediaSearchParamsSchema,
  mediaTypeFromSubjectType,
  searchResponseSchema,
  seasonResponseSchema,
  streamResponseSchema,
  subjectSummarySchema,
} from "./media";

describe("mediaTypeFromSubjectType", () => {
  it("maps the canonical subject types", () => {
    expect(mediaTypeFromSubjectType(1)).toBe("movie");
    expect(mediaTypeFromSubjectType(2)).toBe("series");
    expect(mediaTypeFromSubjectType(7)).toBe("shorts");
  });

  it("falls back to shorts for unknown subject types", () => {
    expect(mediaTypeFromSubjectType(3)).toBe("shorts");
    expect(mediaTypeFromSubjectType(null)).toBe("shorts");
    expect(mediaTypeFromSubjectType(undefined)).toBe("shorts");
  });
});

describe("subjectSummarySchema", () => {
  it("normalizes a raw subject", () => {
    const result = subjectSummarySchema.parse({
      subjectId: "123",
      subjectType: 2,
      title: "Harbor Lights",
      poster: "https://cdn.example/poster.jpg",
      hasResource: true,
      rating: "7.4",
    });

    expect(result).toMatchObject({
      subjectId: "123",
      type: "series",
      title: "Harbor Lights",
      poster: "https://cdn.example/poster.jpg",
      hasResource: true,
      rating: 7.4,
      releaseDate: null,
      description: null,
    });
  });

  it("tolerates missing optional fields", () => {
    const result = subjectSummarySchema.parse({
      subjectId: "123",
      title: "Untitled",
    });

    expect(result.hasResource).toBe(false);
    expect(result.poster).toBeNull();
    expect(result.rating).toBeNull();
  });
});

describe("homeFeedSchema", () => {
  it("normalizes rows and keeps only valid subject shape", () => {
    const result = homeFeedSchema.parse({
      total: 1,
      rows: [
        {
          title: "🔥Hot Short TV",
          opId: "op-1",
          type: "SUBJECTS_MOVIE",
          total: 2,
          subjects: [
            { subjectId: "a", subjectType: 1, title: "Movie A", poster: null, hasResource: true },
            { subjectId: "b", subjectType: 7, title: "Short B", poster: "https://cdn.example/b.jpg" },
          ],
        },
      ],
    });

    expect(result.total).toBe(1);
    expect(result.rows[0]!.subjects[0]!.type).toBe("movie");
    expect(result.rows[0]!.subjects[1]!.type).toBe("shorts");
  });

  it("defaults to empty rows when the feed is empty", () => {
    expect(homeFeedSchema.parse({}).rows).toEqual([]);
  });
});

describe("homeRowsSchema / homeSubjectsSchema", () => {
  it("parses a lightweight row list", () => {
    const result = homeRowsSchema.parse({
      total: 2,
      rows: [{ title: "Anime[English Dubbed]", opId: "op-9" }],
    });
    expect(result.rows[0]).toEqual({ title: "Anime[English Dubbed]", opId: "op-9" });
  });

  it("parses subjects for a row", () => {
    const result = homeSubjectsSchema.parse({
      opId: "op-9",
      title: "Anime[English Dubbed]",
      total: 1,
      subjects: [{ subjectId: "x", subjectType: 2, title: "Series X", poster: null }],
    });
    expect(result.subjects[0]!.type).toBe("series");
    expect(result.title).toBe("Anime[English Dubbed]");
  });
});

describe("searchResponseSchema", () => {
  it("normalizes search items and pager", () => {
    const result = searchResponseSchema.parse({
      items: [
        {
          subjectId: "1654274595068805784",
          subjectType: 1,
          title: "Avatar [Hindi]",
          releaseDate: "2009-12-18",
          duration: "2h 42m",
          genre: "Action, Adventure, Fantasy",
          poster: "https://pbcdn.example/avatar.jpg",
          rating: 7.9,
          language: "English, Spanish",
          country: "United States",
        },
      ],
      pager: { hasMore: true, page: "1", perPage: 20, totalCount: 200 },
    });

    expect(result.items[0]).toMatchObject({
      subjectId: "1654274595068805784",
      type: "movie",
      title: "Avatar [Hindi]",
      rating: 7.9,
    });
    expect(result.pager).toEqual({ hasMore: true, page: 1, perPage: 20, totalCount: 200 });
  });

  it("defaults the pager when absent", () => {
    const result = searchResponseSchema.parse({ items: [] });
    expect(result.pager).toEqual({ hasMore: false, page: 1, perPage: 20, totalCount: 0 });
  });
});

describe("infoResponseSchema", () => {
  it("normalizes details and staff", () => {
    const result = infoResponseSchema.parse({
      subjectId: "1",
      subjectType: 2,
      title: "Harbor Lights",
      description: "A coastal noir.",
      releaseDate: "2023-05-01",
      runtime: 46,
      genre: "Crime",
      poster: "https://cdn.example/p.jpg",
      country: "Nigeria",
      rating: 8.1,
      hasResource: true,
      language: "English",
      staff: [{ name: "Ada Obi", role: "Director", avatar: null }],
    });

    expect(result.type).toBe("series");
    expect(result.hasResource).toBe(true);
    expect(result.staff).toEqual([{ name: "Ada Obi", role: "Director", avatar: null }]);
  });

  it("defaults staff to an empty list", () => {
    const result = infoResponseSchema.parse({ subjectId: "1", subjectType: 1, title: "M" });
    expect(result.staff).toEqual([]);
    expect(result.description).toBeNull();
  });
});

describe("seasonResponseSchema", () => {
  it("normalizes seasons, resolutions, and episodes", () => {
    const result = seasonResponseSchema.parse({
      seasons: [
        {
          season: 1,
          totalEpisode: 8,
          episodesAvailable: 8,
          resolutions: [{ resolution: 720, epNum: 8 }],
          episodes: [{ episode: 1, title: null, releaseDate: null }],
        },
      ],
    });

    const season = result.seasons[0]!;
    expect(season.totalEpisode).toBe(8);
    expect(season.resolutions[0]).toEqual({ resolution: 720, epNum: 8 });
    expect(season.episodes[0]).toEqual({ episode: 1, title: null, releaseDate: null });
  });
});

describe("streamResponseSchema", () => {
  it("normalizes per-quality streams", () => {
    const result = streamResponseSchema.parse({
      streams: [
        {
          quality: "1080p",
          resolution: 1080,
          url: "https://relay.example/media/x?e=1&s=2",
          format: "mp4",
          size: "426 MB",
          codecName: "hevc",
          duration: 4005,
          captions: [],
          se: 1,
          ep: 2,
        },
      ],
      total: 1,
    });

    expect(result.streams[0]).toMatchObject({
      quality: "1080p",
      resolution: 1080,
      se: 1,
      ep: 2,
      captions: [],
    });
    expect(result.total).toBe(1);
  });
});

describe("mediaSearchParamsSchema", () => {
  it("accepts a keyword with defaults", () => {
    const result = mediaSearchParamsSchema.parse({ keyword: "  avatar  " });
    expect(result.keyword).toBe("avatar");
    expect(result.page).toBe(1);
    expect(result.perPage).toBe(20);
  });

  it("rejects an empty keyword", () => {
    expect(() => mediaSearchParamsSchema.parse({ keyword: "" })).toThrow();
  });
});