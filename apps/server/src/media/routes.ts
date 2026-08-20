import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { mediaSearchParamsSchema, mediaStreamParamsSchema } from "@zen-stream/contracts";
import type { MediaInfo, MediaSearchResponse } from "@zen-stream/contracts";
import { ZodError } from "zod";
import { ApiError } from "../errors.js";
import { UpstreamHttpError } from "./client.js";
import type { MediaUpstreamClient } from "./client.js";
import { ProviderRegistry } from "../providers/registry.js";
import { createClientProvider } from "../providers/client-provider.js";
import { dedupeSearchItems } from "../providers/matching.js";
import type { TtlCache } from "../providers/cache.js";
import { createTtlCache } from "../providers/cache.js";
import type { MediaProvider, PlaybackProvider, SecondaryMetadataProvider } from "../providers/types.js";

function parseSubjectId(subjectId: string | undefined): string {
  const trimmed = subjectId?.trim() ?? "";
  if (trimmed.length === 0) {
    throw new ApiError(400, "VALIDATION_ERROR", "A media subject id is required.");
  }
  return trimmed;
}

/** Express 5 route params/query values can be strings or arrays; take the first value. */
function firstParam(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    const [first] = value;
    return typeof first === "string" ? first : undefined;
  }
  return typeof value === "string" ? value : undefined;
}

/** Maps upstream/validation failures to consistent client-facing errors. */
function translateUpstreamError(error: unknown): unknown {
  if (error instanceof UpstreamHttpError) {
    return new ApiError(502, "MEDIA_UPSTREAM_ERROR", "The media API is temporarily unavailable.");
  }
  if (error instanceof ZodError) {
    return new ApiError(502, "MEDIA_UPSTREAM_INVALID", "The media API returned an unexpected payload.");
  }
  return error;
}

/**
 * Whether a failure is upstream-caused (transport, HTTP, or malformed
 * payload) rather than a programming error — the only failures a secondary
 * provider may legitimately fall back for.
 */
function isUpstreamFailure(error: unknown): boolean {
  return error instanceof UpstreamHttpError || error instanceof ZodError;
}

/**
 * Merges several secondary search responses into one result set.
 * Duplicates are removed conservatively — only exact normalized title+type
 * duplicates (never low-confidence merges); the first occurrence wins.
 */
function mergeSearchResponses(responses: MediaSearchResponse[]): MediaSearchResponse {
  const items = dedupeSearchItems(responses.flatMap((response) => response.items));
  const first = responses[0];
  return {
    items,
    pager: {
      hasMore: responses.some((response) => response.pager.hasMore),
      page: first?.pager.page ?? 1,
      perPage: first?.pager.perPage ?? 20,
      totalCount: items.length,
    },
  };
}

/**
 * Search fallback: the primary search failure (e.g. an upstream 406/502)
 * falls back to every secondary provider; all secondary successes are
 * merged (deduplicated), and the original failure is rethrown only when no
 * secondary answers. A genuine primary zero-result success is never
 * overridden.
 */
async function searchWithFallback(
  run: (provider: MediaProvider | SecondaryMetadataProvider) => Promise<MediaSearchResponse>,
  primary: MediaProvider,
  secondaries: SecondaryMetadataProvider[],
): Promise<MediaSearchResponse> {
  try {
    return await run(primary);
  } catch (primaryError: unknown) {
    if (!isUpstreamFailure(primaryError) || secondaries.length === 0) {
      throw primaryError;
    }
    const successes: MediaSearchResponse[] = [];
    for (const secondary of secondaries) {
      try {
        successes.push(await run(secondary));
      } catch {
        // Try the next secondary.
      }
    }
    if (successes.length === 0) {
      throw primaryError;
    }
    return mergeSearchResponses(successes);
  }
}

/* ── Info enrichment ──────────────────────────────────────────────────── */

/** Enrichment is worthwhile when the primary left these fields empty. */
function needsEnrichment(info: MediaInfo): boolean {
  return info.backdrop == null || info.releaseDate == null || info.description == null;
}

function mergeExternalIds(primary: MediaInfo["externalIds"], candidate: MediaInfo["externalIds"]) {
  return {
    moviebox: primary.moviebox ?? candidate.moviebox,
    spun: primary.spun ?? candidate.spun,
    daratech: primary.daratech ?? candidate.daratech,
    imdb: primary.imdb ?? candidate.imdb,
    tmdb: primary.tmdb ?? candidate.tmdb,
  };
}

/**
 * Conservative metadata enrichment: primary-provider data wins for every
 * field it already has; only missing fields are filled from a secondary
 * provider. The canonical identity (subjectId, title, type) and the
 * primary's playback truth (`hasResource`) are never touched — metadata
 * existence never implies playability.
 */
function enrichInfo(primary: MediaInfo, candidate: MediaInfo): MediaInfo {
  return {
    subjectId: primary.subjectId,
    type: primary.type,
    title: primary.title,
    description: primary.description ?? candidate.description,
    releaseDate: primary.releaseDate ?? candidate.releaseDate,
    runtime: primary.runtime ?? candidate.runtime,
    genre: primary.genre ?? candidate.genre,
    poster: primary.poster ?? candidate.poster,
    backdrop: primary.backdrop ?? candidate.backdrop,
    country: primary.country ?? candidate.country,
    rating: primary.rating ?? candidate.rating,
    hasResource: primary.hasResource,
    language: primary.language ?? candidate.language,
    staff: primary.staff.length > 0 ? primary.staff : candidate.staff,
    externalIds: mergeExternalIds(primary.externalIds, candidate.externalIds),
  };
}

/** Cached so repeated detail views don't re-hit every secondary provider. */
const ENRICHMENT_TTL_MS = 10 * 60 * 1000;

/**
 * Details fallback + enrichment:
 *  - primary succeeds → conservatively fill missing fields from the first
 *    secondary that answers (cached per subject); failures never degrade
 *    the primary answer
 *  - primary fails upstream → first secondary success replaces it
 *  - everything fails → the original primary failure surfaces
 */
async function infoWithFallback(
  run: (provider: MediaProvider | SecondaryMetadataProvider) => Promise<MediaInfo>,
  primary: MediaProvider,
  secondaries: SecondaryMetadataProvider[],
  cache: TtlCache<MediaInfo>,
): Promise<MediaInfo> {
  try {
    const info = await run(primary);
    if (!needsEnrichment(info) || secondaries.length === 0) {
      return info;
    }
    const cached = cache.get(info.subjectId);
    if (cached) return cached;
    for (const secondary of secondaries) {
      try {
        const enriched = enrichInfo(info, await run(secondary));
        cache.set(info.subjectId, enriched);
        return enriched;
      } catch {
        // Try the next secondary; never let enrichment break the primary.
      }
    }
    return info;
  } catch (primaryError: unknown) {
    if (!isUpstreamFailure(primaryError) || secondaries.length === 0) {
      throw primaryError;
    }
    for (const secondary of secondaries) {
      try {
        return await run(secondary);
      } catch {
        // Try the next secondary.
      }
    }
    throw primaryError;
  }
}

export interface MediaRouterOptions {
  /** Test hook: inject an enrichment cache (defaults to a fresh TTL cache). */
  enrichmentCache?: TtlCache<MediaInfo>;
}

/**
 * Zen-Stream media proxy routes.
 *
 * The browser talks to these endpoints; upstream media providers are only
 * ever contacted from this server, with their credentials attached there.
 * Providers return canonical contract payloads, so malformed or stale
 * upstream data surfaces as a consistent 502 rather than leaking into the
 * client. An injected client (tests) is adapted through the same provider
 * interfaces as the env-configured registry providers. Secondary metadata
 * providers (Spün, DaraTech, TMDB) are consulted only when the primary
 * fails upstream — a successful primary answer, including a genuine
 * zero-result search, is never overridden.
 */
export function createMediaRouter(
  client?: MediaUpstreamClient,
  providers: ProviderRegistry = new ProviderRegistry(),
  options: MediaRouterOptions = {},
): Router {
  const router = Router();
  const enrichmentCache = options.enrichmentCache ?? createTtlCache<MediaInfo>(ENRICHMENT_TTL_MS);

  function resolveMedia(): MediaProvider {
    if (client) return createClientProvider(client);
    const provider = providers.getMetadata();
    if (!provider) {
      throw new ApiError(
        503,
        "MEDIA_NOT_CONFIGURED",
        "The media API is not configured on this server.",
      );
    }
    return provider;
  }

  function resolvePlayback(): PlaybackProvider {
    if (client) return createClientProvider(client);
    const provider = providers.getPlayback();
    if (!provider) {
      throw new ApiError(
        503,
        "MEDIA_NOT_CONFIGURED",
        "The media API is not configured on this server.",
      );
    }
    return provider;
  }

  function handle(
    run: (media: MediaProvider, req: Request, res: Response) => Promise<void>,
  ) {
    return (req: Request, res: Response, next: NextFunction) => {
      let promise: Promise<void>;
      try {
        promise = run(resolveMedia(), req, res);
      } catch (error) {
        next(translateUpstreamError(error));
        return;
      }
      promise.catch((error: unknown) => {
        next(translateUpstreamError(error));
      });
    };
  }

  router.get(
    "/home",
    handle(async (media, _req, res) => {
      res.json(await media.fetchHome());
    }),
  );

  router.get(
    "/home/rows",
    handle(async (media, _req, res) => {
      res.json(await media.fetchHomeRows());
    }),
  );

  router.get(
    "/home/subjects",
    handle(async (media, req, res) => {
      const opId = parseSubjectId(firstParam(req.query.opId));
      res.json(await media.fetchHomeSubjects(opId));
    }),
  );

  router.get(
    "/search",
    handle(async (media, req, res) => {
      const params = mediaSearchParamsSchema.safeParse({
        keyword: firstParam(req.query.q) ?? "",
        page: firstParam(req.query.page) ?? "1",
        perPage: firstParam(req.query.perPage) ?? "20",
      });
      if (!params.success) {
        throw new ApiError(400, "VALIDATION_ERROR", "A non-empty search query is required.");
      }
      const result = await searchWithFallback(
        (provider) => provider.fetchSearch(params.data),
        media,
        providers.getSecondaries(),
      );
      res.json(result);
    }),
  );

  router.get(
    "/info/:subjectId",
    handle(async (media, req, res) => {
      const subjectId = parseSubjectId(firstParam(req.params.subjectId));
      const result = await infoWithFallback(
        (provider) => provider.fetchInfo(subjectId),
        media,
        providers.getSecondaries(),
        enrichmentCache,
      );
      res.json(result);
    }),
  );

  router.get(
    "/season/:subjectId",
    handle(async (media, req, res) => {
      res.json(await media.fetchSeason(parseSubjectId(firstParam(req.params.subjectId))));
    }),
  );

  router.get(
    "/stream/:subjectId",
    (req: Request, res: Response, next: NextFunction) => {
      const run = async (playback: PlaybackProvider, request: Request, response: Response) => {
        const params = mediaStreamParamsSchema.safeParse({
          subjectId: parseSubjectId(firstParam(request.params.subjectId)),
          se: firstParam(request.query.se) ?? "0",
          ep: firstParam(request.query.ep) ?? "0",
        });
        if (!params.success) {
          throw new ApiError(400, "VALIDATION_ERROR", "Invalid season or episode parameters.");
        }
        response.json(
          await playback.fetchStream(params.data.subjectId, { se: params.data.se, ep: params.data.ep }),
        );
      };
      let promise: Promise<void>;
      try {
        promise = run(resolvePlayback(), req, res);
      } catch (error) {
        next(translateUpstreamError(error));
        return;
      }
      promise.catch((error: unknown) => {
        next(translateUpstreamError(error));
      });
    },
  );

  return router;
}