import { describe, expect, it, vi } from "vitest";
import {
  createIdentityResolver,
  daratechIdFromMovieBox,
  EMPTY_IDENTITY,
  isDaratechId,
  isMovieBoxId,
  isSpunId,
  movieBoxIdFromDaratech,
  parseTmdbSubjectId,
  staticIdentityForSubject,
} from "./identity.js";
import type { ResolveFn } from "./identity.js";
import type { SpunResolveResult } from "./spun/types.js";

const SPIDERMAN_MOVIEBOX_ID = "6026412232966389904";
const SPIDERMAN_DARATECH_ID = "NjAyNjQxMjIzMjk2NjM4OTkwNDo6OnBpY2E";

describe("id helpers", () => {
  it("recognizes MovieBox numeric ids", () => {
    expect(isMovieBoxId("6026412232966389904")).toBe(true);
    expect(isMovieBoxId("42")).toBe(true);
    expect(isMovieBoxId("fight-club-828920")).toBe(false);
    expect(isMovieBoxId("movie:27205")).toBe(false);
    expect(isMovieBoxId("")).toBe(false);
  });

  it("recognizes Spün slugs", () => {
    expect(isSpunId("fight-club-828920")).toBe(true);
    expect(isSpunId("the-matrix-reloaded-958850")).toBe(true);
    expect(isSpunId("6026412232966389904")).toBe(false);
    expect(isSpunId("fight-club")).toBe(false);
  });

  it("round-trips MovieBox ↔ DaraTech ids deterministically", () => {
    const encoded = daratechIdFromMovieBox(SPIDERMAN_MOVIEBOX_ID);
    expect(encoded).toBe(SPIDERMAN_DARATECH_ID);
    expect(movieBoxIdFromDaratech(encoded)).toBe(SPIDERMAN_MOVIEBOX_ID);
    expect(isDaratechId(encoded)).toBe(true);
  });

  it("rejects malformed DaraTech ids", () => {
    expect(movieBoxIdFromDaratech("not-base64!")).toBeNull();
    expect(movieBoxIdFromDaratech(daratechIdFromMovieBox("abc"))).toBeNull();
    expect(isDaratechId("fight-club-828920")).toBe(false);
  });

  it("parses TMDB namespaced subject ids", () => {
    expect(parseTmdbSubjectId("movie:27205")).toEqual({ kind: "movie", id: 27205 });
    expect(parseTmdbSubjectId("series:1396")).toEqual({ kind: "series", id: 1396 });
    expect(parseTmdbSubjectId("6026412232966389904")).toBeNull();
  });

  it("derives static identities without network calls", () => {
    expect(staticIdentityForSubject(SPIDERMAN_MOVIEBOX_ID)).toEqual({
      moviebox: SPIDERMAN_MOVIEBOX_ID,
      spun: null,
      daratech: SPIDERMAN_DARATECH_ID,
      imdb: null,
      tmdb: null,
    });
    expect(staticIdentityForSubject("fight-club-828920")).toEqual({
      moviebox: null,
      spun: "fight-club-828920",
      daratech: null,
      imdb: null,
      tmdb: null,
    });
    expect(staticIdentityForSubject(SPIDERMAN_DARATECH_ID).moviebox).toBe(SPIDERMAN_MOVIEBOX_ID);
    expect(staticIdentityForSubject("movie:27205")).toEqual({ ...EMPTY_IDENTITY, tmdb: 27205 });
    expect(staticIdentityForSubject("garbage")).toEqual(EMPTY_IDENTITY);
  });
});

describe("createIdentityResolver", () => {
  function resolverWith(results: Record<string, SpunResolveResult | null>) {
    const resolve = vi.fn<ResolveFn>(async (namespace, id) => results[`${namespace}:${id}`] ?? null);
    return { resolver: createIdentityResolver(resolve), resolve };
  }

  const SAMPLE_RESULT = (spunId: string): SpunResolveResult => ({
    spun_id: spunId,
    type: "movie",
    title: "Sample",
    year: null,
    rating: null,
    poster: null,
  });

  it("resolves MovieBox ids to Spün ids (MovieBox ↔ Spün)", async () => {
    const { resolver, resolve } = resolverWith({
      "moviebox:6026412232966389904": SAMPLE_RESULT("spider-man-brand-new-day-824972"),
    });

    const identity = await resolver.resolveMovieBoxId(SPIDERMAN_MOVIEBOX_ID);

    expect(identity).toMatchObject({
      moviebox: SPIDERMAN_MOVIEBOX_ID,
      spun: "spider-man-brand-new-day-824972",
      daratech: SPIDERMAN_DARATECH_ID,
    });
    expect(resolve).toHaveBeenCalledWith("moviebox", SPIDERMAN_MOVIEBOX_ID);
  });

  it("resolves TMDB ids to Spün ids (TMDB ↔ Spün)", async () => {
    const { resolver } = resolverWith({ "tmdb:550": SAMPLE_RESULT("fight-club-828920") });

    const identity = await resolver.resolveTmdbId(550);

    expect(identity).toMatchObject({ tmdb: 550, spun: "fight-club-828920" });
  });

  it("resolves IMDb ids to Spün ids (IMDb ↔ Spün)", async () => {
    const { resolver } = resolverWith({ "imdb:tt0137523": SAMPLE_RESULT("fight-club-828920") });

    const identity = await resolver.resolveImdbId("tt0137523");

    expect(identity).toMatchObject({ imdb: "tt0137523", spun: "fight-club-828920" });
  });

  it("keeps the input identity when the resolver has no match", async () => {
    const { resolver } = resolverWith({});

    const identity = await resolver.resolveMovieBoxId("999999999");

    // The MovieBox id itself is known deterministically even though no
    // Spün match exists — identity is never guessed, but never discarded.
    expect(identity).toMatchObject({ moviebox: "999999999", spun: null });
    expect(identity.daratech).not.toBeNull();
  });

  it("does not guess identities without a resolver", async () => {
    const resolver = createIdentityResolver(null);

    expect(await resolver.resolveMovieBoxId(SPIDERMAN_MOVIEBOX_ID)).toMatchObject({
      moviebox: SPIDERMAN_MOVIEBOX_ID,
      spun: null,
    });
    expect(await resolver.resolveTmdbId(550)).toMatchObject({ tmdb: 550, spun: null });
  });

  it("caches successful resolutions but never failures", async () => {
    const resolve = vi.fn<ResolveFn>(async (namespace, id) =>
      id === "550" ? SAMPLE_RESULT("fight-club-828920") : null,
    );
    const resolver = createIdentityResolver(resolve);

    await resolver.resolveTmdbId(550);
    await resolver.resolveTmdbId(550);
    await resolver.resolveMovieBoxId("999999999");
    await resolver.resolveMovieBoxId("999999999");

    // One cached success + two uncached failures (failures are never cached).
    expect(resolve).toHaveBeenCalledTimes(3);
  });
});