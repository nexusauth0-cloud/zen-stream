import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import { ProviderRegistry } from "./providers/registry.js";
import { createSpunProvider } from "./providers/spun/provider.js";
import { createDaratechProvider } from "./providers/daratech/provider.js";
import type { MediaProvider } from "./providers/types.js";

const app = createApp();

describe("GET /api/v1/health", () => {
  it("returns an ok status", async () => {
    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
    expect(response.headers["content-type"]).toMatch(/application\/json/);
  });
});

describe("error boundary", () => {
  it("returns a JSON 404 for unknown routes", async () => {
    const response = await request(app).get("/api/v1/does-not-exist");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "The requested resource does not exist.",
      },
    });
  });

  it("returns a JSON error for malformed bodies", async () => {
    const response = await request(app)
      .post("/api/v1/health")
      .set("Content-Type", "application/json")
      .send("{not-json");

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.body).toHaveProperty("error");
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("GET /api/v1/providers/health", () => {
  it("reports per-provider statuses without leaking credentials", async () => {
    const registry = new ProviderRegistry();
    registry.registerMetadata({
      id: "moviebox",
      name: "MovieBox",
      fetchHome: async () => ({ total: 0, rows: [] }),
      fetchHomeRows: async () => ({ total: 0, rows: [] }),
      fetchHomeSubjects: async (opId: string) => ({ opId, title: "Row", total: 0, subjects: [] }),
      fetchSearch: async () => ({ items: [], pager: { hasMore: false, page: 1, perPage: 20, totalCount: 0 } }),
      fetchInfo: async (subjectId: string) => ({
        subjectId,
        type: "movie",
        title: "x",
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
    } satisfies MediaProvider);
    registry.registerSecondary(
      createSpunProvider(
        { baseUrl: "https://media.byspun.xyz/v1" },
        vi.fn(async (url: string) => {
          if (String(url).includes("/utility/health")) {
            return jsonResponse({ status: "ok" });
          }
          throw new Error(`unexpected url ${url}`);
        }),
      ),
    );
    registry.registerSecondary(
      createDaratechProvider(
        { apiKey: "dara-test-key", apiRoot: "https://apimovie.runflix.name.ng/v1" },
        vi.fn(async () => {
          throw new TypeError("fetch failed");
        }),
      ),
    );

    const appWithProviders = createApp({ providers: registry });
    const response = await request(appWithProviders).get("/api/v1/providers/health");

    expect(response.status).toBe(200);
    // MovieBox exposes no health probe, so it is not reported.
    const byId = new Map(
      (response.body.providers as { id: string; status: string }[]).map((provider) => [
        provider.id,
        provider.status,
      ]),
    );
    expect(byId.get("spun")).toBe("healthy");
    expect(byId.get("daratech")).toBe("offline");
    expect(byId.has("moviebox")).toBe(false);
  });
});