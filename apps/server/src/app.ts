import express from "express";
import { healthResponseSchema, providerHealthResponseSchema } from "@zen-stream/contracts";
import { errorHandler, notFoundHandler } from "./errors.js";
import { createMediaRouter } from "./media/routes.js";
import type { MediaUpstreamClient } from "./media/client.js";
import { mediaApiConfig } from "./media/config.js";
import { ProviderRegistry } from "./providers/registry.js";
import { createMovieBoxProvider } from "./providers/moviebox/provider.js";
import { tmdbApiConfig } from "./providers/tmdb/config.js";
import { createTmdBProvider } from "./providers/tmdb/provider.js";
import { spunMediaConfig } from "./providers/spun/config.js";
import { createSpunProvider } from "./providers/spun/provider.js";
import { daratechConfig } from "./providers/daratech/config.js";
import { createDaratechProvider } from "./providers/daratech/provider.js";

export interface CreateAppOptions {
  /** Inject a media upstream client (used by tests; defaults to env-configured). */
  mediaClient?: MediaUpstreamClient;
  /** Inject providers directly (tests); defaults to the env-configured registry. */
  providers?: ProviderRegistry;
}

/**
 * The production registry:
 *  - MovieBox (env-configured) as primary metadata + playback provider
 *  - Spün Media (no key required) as a secondary metadata provider
 *  - DaraTech (only when DARATECH_API_KEY is set) as a secondary metadata
 *    provider
 *  - TMDB (only when TMDB_API_KEY is set) as a secondary metadata provider
 *    (release-date/backdrop authority)
 *
 * Registration order keeps MovieBox the default for every role; secondary
 * providers are optional and never replace it. Secondary providers are
 * metadata/discovery-only — they never serve playback.
 */
export function createDefaultRegistry(): ProviderRegistry {
  const registry = new ProviderRegistry();
  const config = mediaApiConfig();
  if (config) {
    registry.register(createMovieBoxProvider(config));
  }
  registry.registerSecondary(createSpunProvider(spunMediaConfig()));
  const daratech = daratechConfig();
  if (daratech) {
    registry.registerSecondary(createDaratechProvider(daratech));
  }
  const tmdbConfig = tmdbApiConfig();
  if (tmdbConfig) {
    registry.registerSecondary(createTmdBProvider(tmdbConfig));
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

  // An injected client (tests) means the caller controls the providers;
  // without an explicit registry there are no secondary providers so tests
  // never accidentally hit real network providers.
  const providers = options.providers ?? (options.mediaClient ? new ProviderRegistry() : createDefaultRegistry());

  /**
   * Lightweight provider health for debugging/observability. Only providers
   * that expose a health probe are reported; statuses are derived from the
   * provider itself and never leak credentials or internal details.
   */
  app.get("/api/v1/providers/health", async (_req, res, next) => {
    try {
      const candidates = [
        ...providers.getMetadataProviders(),
        ...providers.getPlaybackProviders(),
        ...providers.getSecondaries(),
      ].filter((provider) => typeof provider.health === "function");
      const unique = candidates.filter(
        (provider, index, all) => all.findIndex((other) => other.id === provider.id) === index,
      );
      const reports = await Promise.all(
        unique.map(async (provider) => {
          try {
            return {
              id: provider.id,
              name: provider.name,
              status: (await provider.health?.()) ?? ("offline" as const),
            };
          } catch {
            return { id: provider.id, name: provider.name, status: "offline" as const };
          }
        }),
      );
      res.json(providerHealthResponseSchema.parse({ providers: reports }));
    } catch (error) {
      next(error);
    }
  });

  app.use("/api/v1/media", createMediaRouter(options.mediaClient, providers));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}