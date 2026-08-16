import express from "express";
import { healthResponseSchema } from "@zen-stream/contracts";
import { errorHandler, notFoundHandler } from "./errors.js";
import { createMediaRouter } from "./media/routes.js";
import type { MediaUpstreamClient } from "./media/client.js";

export interface CreateAppOptions {
  /** Inject a media upstream client (used by tests; defaults to env-configured). */
  mediaClient?: MediaUpstreamClient;
}

export function createApp(options: CreateAppOptions = {}): express.Express {
  const app = express();

  app.use(express.json());

  app.get("/api/v1/health", (_req, res) => {
    const body = healthResponseSchema.parse({ status: "ok" });
    res.json(body);
  });

  app.use("/api/v1/media", createMediaRouter(options.mediaClient));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}