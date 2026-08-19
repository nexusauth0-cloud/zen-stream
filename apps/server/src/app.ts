import express from "express";
import { healthResponseSchema } from "@zen-stream/contracts";
import { errorHandler, notFoundHandler } from "./errors.js";
import { createMediaRouter } from "./media/routes.js";
import type { MediaUpstreamClient } from "./media/client.js";
import { mediaApiConfig } from "./media/config.js";
import { ProviderRegistry } from "./providers/registry.js";
import { createMovieBoxProvider } from "./providers/moviebox/provider.js";

export interface CreateAppOptions {
  /** Inject a media upstream client (used by tests; defaults to env-configured). */
  mediaClient?: MediaUpstreamClient;
  /** Inject providers directly (tests); defaults to the env-configured registry. */
  providers?: ProviderRegistry;
}

/** The production registry: the env-configured MovieBox provider. */
export function createDefaultRegistry(): ProviderRegistry {
  const registry = new ProviderRegistry();
  const config = mediaApiConfig();
  if (config) {
    registry.register(createMovieBoxProvider(config));
  }
  return registry;
}

export function createApp(options: CreateAppOptions = {}): express.Express {
  const app = express();

  app.use(express.json());

  app.get("/api/v1/health", (_req, res) => {
    const body = healthResponseSchema.parse({ status: "ok" });
    res.json(body);
  });

  const providers = options.providers ?? createDefaultRegistry();
  app.use("/api/v1/media", createMediaRouter(options.mediaClient, providers));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}