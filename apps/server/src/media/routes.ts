import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { mediaSearchParamsSchema, mediaStreamParamsSchema } from "@zen-stream/contracts";
import { ZodError } from "zod";
import { ApiError } from "../errors.js";
import { UpstreamHttpError } from "./client.js";
import type { MediaUpstreamClient } from "./client.js";
import { ProviderRegistry } from "../providers/registry.js";
import { createClientProvider } from "../providers/client-provider.js";
import type { MediaProvider, PlaybackProvider } from "../providers/types.js";

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
 * Zen-Stream media proxy routes.
 *
 * The browser talks to these endpoints; upstream media providers are only
 * ever contacted from this server, with their credentials attached there.
 * Providers return canonical contract payloads, so malformed or stale
 * upstream data surfaces as a consistent 502 rather than leaking into the
 * client. An injected client (tests) is adapted through the same provider
 * interfaces as the env-configured registry providers.
 */
export function createMediaRouter(
  client?: MediaUpstreamClient,
  providers: ProviderRegistry = new ProviderRegistry(),
): Router {
  const router = Router();

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
      res.json(await media.fetchSearch(params.data));
    }),
  );

  router.get(
    "/info/:subjectId",
    handle(async (media, req, res) => {
      res.json(await media.fetchInfo(parseSubjectId(firstParam(req.params.subjectId))));
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