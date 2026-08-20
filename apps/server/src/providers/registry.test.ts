import { describe, expect, it } from "vitest";
import { ProviderRegistry } from "./registry.js";
import type { MediaProvider, PlaybackProvider, SecondaryMetadataProvider } from "./types.js";

function metadataProvider(id: string): MediaProvider {
  return {
    id,
    name: id,
    fetchHome: async () => ({ total: 0, rows: [] }),
    fetchHomeRows: async () => ({ total: 0, rows: [] }),
    fetchHomeSubjects: async (opId: string) => ({ opId, title: id, total: 0, subjects: [] }),
    fetchSearch: async () => ({ items: [], pager: { hasMore: false, page: 1, perPage: 20, totalCount: 0 } }),
    fetchInfo: async (subjectId: string) => ({
      subjectId,
      type: "movie",
      title: id,
      description: null,
      releaseDate: null,
      runtime: null,
      genre: null,
      poster: null,
      backdrop: null,
      country: null,
      rating: null,
      hasResource: false,
      language: null,
      staff: [],
      externalIds: { moviebox: null, spun: null, daratech: null, imdb: null, tmdb: null },
    }),
    fetchSeason: async () => ({ seasons: [] }),
  };
}

function playbackProvider(id: string): PlaybackProvider {
  return {
    id,
    name: id,
    fetchStream: async () => ({ streams: [], total: 0 }),
  };
}

function secondaryProvider(id: string): SecondaryMetadataProvider {
  return {
    id,
    name: id,
    fetchSearch: async () => ({ items: [], pager: { hasMore: false, page: 1, perPage: 20, totalCount: 0 } }),
    fetchInfo: async (subjectId: string) => ({
      subjectId,
      type: "movie",
      title: id,
      description: null,
      releaseDate: null,
      runtime: null,
      genre: null,
      poster: null,
      backdrop: null,
      country: null,
      rating: null,
      hasResource: false,
      language: null,
      staff: [],
      externalIds: { moviebox: null, spun: null, daratech: null, imdb: null, tmdb: null },
    }),
  };
}

describe("ProviderRegistry", () => {
  it("returns null when nothing is registered", () => {
    const registry = new ProviderRegistry();
    expect(registry.getMetadata()).toBeNull();
    expect(registry.getPlayback()).toBeNull();
    expect(registry.hasMetadata()).toBe(false);
    expect(registry.hasPlayback()).toBe(false);
  });

  it("treats the first registered provider of a role as the default", () => {
    const registry = new ProviderRegistry();
    const primary = metadataProvider("primary");
    const secondary = metadataProvider("secondary");
    registry.registerMetadata(primary).registerMetadata(secondary);

    expect(registry.getMetadata()?.id).toBe("primary");
    expect(registry.getMetadata("secondary")?.id).toBe("secondary");
    expect(registry.getMetadata("missing")).toBeNull();
  });

  it("keeps metadata and playback roles independent", () => {
    const registry = new ProviderRegistry();
    registry.registerMetadata(metadataProvider("metadata-a"));
    registry.registerPlayback(playbackProvider("playback-a"));

    expect(registry.getMetadata()?.id).toBe("metadata-a");
    expect(registry.getPlayback()?.id).toBe("playback-a");
    expect(registry.hasPlayback()).toBe(true);
  });

  it("registers a combined provider for both roles", () => {
    const registry = new ProviderRegistry();
    const combined = { ...metadataProvider("combined"), ...playbackProvider("combined") };
    registry.register(combined);

    expect(registry.getMetadata()?.id).toBe("combined");
    expect(registry.getPlayback()?.id).toBe("combined");
  });

  it("keeps the original default when a named provider overrides a role", () => {
    const registry = new ProviderRegistry();
    registry.registerMetadata(metadataProvider("first"));
    registry.registerPlayback(playbackProvider("first"));
    registry.registerMetadata(metadataProvider("second"));

    expect(registry.getMetadata()?.id).toBe("first");
    expect(registry.getMetadata("second")?.id).toBe("second");
  });

  it("registers a secondary metadata provider independently of other roles", () => {
    const registry = new ProviderRegistry();
    registry.registerMetadata(metadataProvider("moviebox"));
    registry.registerSecondary(secondaryProvider("tmdb"));

    expect(registry.hasSecondary()).toBe(true);
    expect(registry.getSecondary()?.id).toBe("tmdb");
    expect(registry.getMetadata()?.id).toBe("moviebox");
  });

  it("keeps the primary metadata provider as default when a secondary is added", () => {
    const registry = new ProviderRegistry();
    registry.registerMetadata(metadataProvider("moviebox"));
    registry.registerPlayback(playbackProvider("moviebox"));
    registry.registerSecondary(secondaryProvider("tmdb"));

    expect(registry.getMetadata()?.id).toBe("moviebox");
    expect(registry.getPlayback()?.id).toBe("moviebox");
    expect(registry.getSecondary()?.id).toBe("tmdb");
  });

  it("treats the first registered secondary as the default and allows named lookups", () => {
    const registry = new ProviderRegistry();
    registry.registerSecondary(secondaryProvider("tmdb"));
    registry.registerSecondary(secondaryProvider("other"));

    expect(registry.getSecondary()?.id).toBe("tmdb");
    expect(registry.getSecondary("other")?.id).toBe("other");
    expect(registry.getSecondary("missing")).toBeNull();
  });

  it("reports no secondary when none is registered", () => {
    const registry = new ProviderRegistry();
    expect(registry.hasSecondary()).toBe(false);
    expect(registry.getSecondary()).toBeNull();
  });

  it("lists secondaries in registration order for fallback", () => {
    const registry = new ProviderRegistry();
    registry.registerSecondary(secondaryProvider("spun"));
    registry.registerSecondary(secondaryProvider("daratech"));
    registry.registerSecondary(secondaryProvider("tmdb"));

    expect(registry.getSecondaries().map((provider) => provider.id)).toEqual([
      "spun",
      "daratech",
      "tmdb",
    ]);
    expect(registry.getMetadataProviders().map((provider) => provider.id)).toEqual([]);
  });

  it("lists providers of each role without mixing roles", () => {
    const registry = new ProviderRegistry();
    const combined = { ...metadataProvider("moviebox"), ...playbackProvider("moviebox") };
    registry.register(combined);
    registry.registerMetadata(metadataProvider("other"));
    registry.registerSecondary(secondaryProvider("spun"));

    expect(registry.getMetadataProviders().map((provider) => provider.id)).toEqual([
      "moviebox",
      "other",
    ]);
    expect(registry.getPlaybackProviders().map((provider) => provider.id)).toEqual(["moviebox"]);
    expect(registry.getSecondaries().map((provider) => provider.id)).toEqual(["spun"]);
  });
});