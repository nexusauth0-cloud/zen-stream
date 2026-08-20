/**
 * Cross-provider identity resolution.
 *
 * Zen-Stream titles carry provider-native ids (MovieBox numeric resource
 * ids, Spün slugs, DaraTech base64 ids, TMDB/IMDb ids). These helpers and
 * the {@link IdentityResolver} translate between them deterministically
 * where possible (MovieBox ↔ DaraTech is pure arithmetic) and through
 * Spün's `/utility/resolve` namespaces otherwise. Identity is never
 * guessed from title similarity here — that is left to the matching rules
 * in `matching.ts`, which are deliberately conservative.
 */
import type { SpunResolveNamespace, SpunResolveResult } from "./spun/types.js";
import { createTtlCache } from "./cache.js";

/** A provider-agnostic identity record for a title. */
export interface ResolvedIdentity {
  moviebox: string | null;
  spun: string | null;
  daratech: string | null;
  imdb: string | null;
  tmdb: number | null;
}

export const EMPTY_IDENTITY: ResolvedIdentity = {
  moviebox: null,
  spun: null,
  daratech: null,
  imdb: null,
  tmdb: null,
};

/** MovieBox ids are plain numeric resource ids. */
export function isMovieBoxId(id: string): boolean {
  return /^\d+$/.test(id);
}

/** Spün ids look like `title-slug-XXXXXX` (slug + 6 digits). */
export function isSpunId(id: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*-\d{6}$/.test(id);
}

/** DaraTech ids are base64 of `<numericMovieBoxId>:::pica`, unpadded. */
export function isDaratechId(id: string): boolean {
  return movieBoxIdFromDaratech(id) !== null;
}

export function daratechIdFromMovieBox(movieboxId: string): string {
  return Buffer.from(`${movieboxId}:::pica`, "utf8").toString("base64").replace(/=+$/, "");
}

/** Decodes a DaraTech id back to its MovieBox numeric resource id. */
export function movieBoxIdFromDaratech(daratechId: string): string | null {
  let decoded: string;
  try {
    // DaraTech emits unpadded base64; re-pad before decoding.
    const padded = daratechId.padEnd(Math.ceil(daratechId.length / 4) * 4, "=");
    decoded = Buffer.from(padded, "base64").toString("utf8");
  } catch {
    return null;
  }
  const match = /^(\d+):::pica$/.exec(decoded);
  return match?.[1] ?? null;
}

/** TMDB namespaced subject ids are `movie:<id>` / `series:<id>`. */
export function parseTmdbSubjectId(subjectId: string): { kind: "movie" | "series"; id: number } | null {
  const match = /^(movie|series):(\d+)$/.exec(subjectId);
  if (!match) return null;
  return { kind: match[1] === "movie" ? "movie" : "series", id: Number(match[2]) };
}

/**
 * The deterministic identity derivable from a subject id alone — no
 * network calls. TMDB/IMDb identities require live resolution.
 */
export function staticIdentityForSubject(subjectId: string): ResolvedIdentity {
  if (isMovieBoxId(subjectId)) {
    return { ...EMPTY_IDENTITY, moviebox: subjectId, daratech: daratechIdFromMovieBox(subjectId) };
  }
  if (isSpunId(subjectId)) {
    return { ...EMPTY_IDENTITY, spun: subjectId };
  }
  if (isDaratechId(subjectId)) {
    return { ...EMPTY_IDENTITY, daratech: subjectId, moviebox: movieBoxIdFromDaratech(subjectId) };
  }
  const tmdb = parseTmdbSubjectId(subjectId);
  if (tmdb) {
    return { ...EMPTY_IDENTITY, tmdb: tmdb.id };
  }
  return EMPTY_IDENTITY;
}

/** The network-backed resolver surface used by providers and routes. */
export interface IdentityResolver {
  resolveMovieBoxId(id: string): Promise<ResolvedIdentity>;
  resolveTmdbId(id: number | string): Promise<ResolvedIdentity>;
  resolveImdbId(id: string): Promise<ResolvedIdentity>;
}

export interface ResolveFn {
  (namespace: SpunResolveNamespace, id: string): Promise<SpunResolveResult | null>;
}

const RESOLVE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Creates a resolver backed by a Spün `/utility/resolve` client. Successful
 * resolutions are cached for a day (ids are stable); failures are never
 * cached so transient errors don't go stale.
 */
export function createIdentityResolver(
  resolve: ResolveFn | null,
  now: () => number = Date.now,
): IdentityResolver {
  const cache = createTtlCache<SpunResolveResult>(RESOLVE_CACHE_TTL_MS, now);

  async function viaResolve(namespace: SpunResolveNamespace, id: string): Promise<ResolvedIdentity> {
    if (!resolve) {
      return baseIdentity(namespace, id);
    }
    const cacheKey = `${namespace}:${id}`;
    const cached = cache.get(cacheKey);
    const result = cached ?? (await resolve(namespace, id));
    if (!result) {
      return baseIdentity(namespace, id);
    }
    cache.set(cacheKey, result);
    return { ...baseIdentity(namespace, id), spun: result.spun_id };
  }

  /** The deterministic identity for a namespace+id before any live lookup. */
  function baseIdentity(namespace: SpunResolveNamespace, id: string): ResolvedIdentity {
    switch (namespace) {
      case "moviebox":
        return staticIdentityForSubject(id);
      case "tmdb":
        return { ...EMPTY_IDENTITY, tmdb: Number(id) || null };
      case "imdb":
        return { ...EMPTY_IDENTITY, imdb: id };
      default:
        return EMPTY_IDENTITY;
    }
  }

  return {
    resolveMovieBoxId: (id: string) => viaResolve("moviebox", id),
    resolveTmdbId: (id: number | string) => viaResolve("tmdb", String(id)),
    resolveImdbId: (id: string) => viaResolve("imdb", id),
  };
}