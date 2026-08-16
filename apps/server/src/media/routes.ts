import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { mediaSearchParamsSchema, mediaStreamParamsSchema } from "@zen-stream/contracts";
import { ZodError } from "zod";
import { ApiError } from "../errors.js";
import { createMediaClient, UpstreamHttpError } from "./client.js";
import type { MediaUpstreamClient } from "./client.js";
import { mediaApiConfig } from "./config.js";

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
 * The browser talks to these endpoints; the upstream media worker is only
 * ever contacted from this server, with its secret attached here. Upstream
 * payloads are validated against the shared contracts before being emitted,
 * so malformed or stale upstream data surfaces as a consistent 502 rather
 * than leaking into the client.
 */
export function createMediaRouter(client?: MediaUpstreamClient): Router {
  const router = Router();

  function resolveClient(): MediaUpstreamClient {
    if (client) return client;
    const config = mediaApiConfig();
    if (!config) {
      throw new ApiError(
        503,
        "MEDIA_NOT_CONFIGURED",
        "The media API is not configured on this server.",
      );
    }
    return createMediaClient(config);
  }

  function handle(
    run: (media: MediaUpstreamClient, req: Request, res: Response) => Promise<void>,
  ) {
    return (req: Request, res: Response, next: NextFunction) => {
      let promise: Promise<void>;
      try {
        promise = run(resolveClient(), req, res);
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
    handle(async (media, req, res) => {
      const params = mediaStreamParamsSchema.safeParse({
        subjectId: parseSubjectId(firstParam(req.params.subjectId)),
        se: firstParam(req.query.se) ?? "0",
        ep: firstParam(req.query.ep) ?? "0",
      });
      if (!params.success) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid season or episode parameters.");
      }
      res.json(
        await media.fetchStream(params.data.subjectId, { se: params.data.se, ep: params.data.ep }),
      );
    }),
  );

  return router;
}