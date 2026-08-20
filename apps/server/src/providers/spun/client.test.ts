import { describe, expect, it, vi } from "vitest";
import { createSpunClient } from "./client.js";
import type { UpstreamFetch } from "../../media/client.js";

const CONFIG = { baseUrl: "https://media.byspun.xyz/v1" };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function clientWith(fetchImpl: UpstreamFetch) {
  return createSpunClient(CONFIG, fetchImpl);
}

const SEARCH_FIXTURE = {
  page: 1,
  total_pages: 3,
  total_results: 68,
  results: [
    {
      spun_id: "the-matrix-387273",
      type: "movie",
      title: "The Matrix",
      year: 1999,
      rating: 8.3,
      poster: "https://image.tmdb.org/t/p/w342/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg",
    },
  ],
};

describe("createSpunClient", () => {
  it("searches with keyword and page params and no auth header", async () => {
    const fetchImpl = vi.fn<UpstreamFetch>(async (url: string, init?: RequestInit) => {
      expect(url).toContain("/search?q=matrix&page=1");
      expect(init?.headers).not.toHaveProperty("Authorization");
      return jsonResponse(SEARCH_FIXTURE);
    });

    const page = await clientWith(fetchImpl).search({ keyword: "matrix", page: 1 });

    expect(page.results[0]).toMatchObject({ spun_id: "the-matrix-387273", title: "The Matrix" });
    expect(page.total_pages).toBe(3);
  });

  it("fetches info by spun id", async () => {
    const fetchImpl = vi.fn<UpstreamFetch>(async (url: string) => {
      expect(url).toContain("/info/fight-club-828920");
      return jsonResponse({
        spun_id: "fight-club-828920",
        type: "movie",
        title: "Fight Club",
        year: 1999,
        rating: 8.4,
        overview: "A ticking-time-bomb insomniac.",
        status: "Released",
        runtime: 139,
        genres: ["drama", "thriller"],
        poster: "https://image.tmdb.org/t/p/w500/jSziioSwPVrOy9Yow3XhWIBDjq1.jpg",
        backdrop: "https://image.tmdb.org/t/p/w1280/c6OLXfKAk5BKeR6broC8pYiCquX.jpg",
        cast: [{ name: "Edward Norton", character: "Narrator", image: "https://img/x.jpg" }],
      });
    });

    const info = await clientWith(fetchImpl).info("fight-club-828920");

    expect(info).toMatchObject({ spun_id: "fight-club-828920", title: "Fight Club", runtime: 139 });
    expect(info.cast[0]).toMatchObject({ name: "Edward Norton", character: "Narrator" });
  });

  it("resolves identities through /utility/resolve namespaces", async () => {
    const fetchImpl = vi.fn<UpstreamFetch>(async (url: string) => {
      expect(url).toContain("/utility/resolve/moviebox?id=6026412232966389904");
      return jsonResponse({
        spun_id: "spider-man-brand-new-day-824972",
        type: "movie",
        title: "Spider-Man: Brand New Day",
        year: 2026,
        rating: 7.9,
      });
    });

    const result = await clientWith(fetchImpl).resolve("moviebox", "6026412232966389904");

    expect(result).toMatchObject({ spun_id: "spider-man-brand-new-day-824972" });
  });

  it("rejects unknown resolve namespaces", async () => {
    const fetchImpl = vi.fn<UpstreamFetch>(async () => jsonResponse({}));

    await expect(clientWith(fetchImpl).resolve("bogus" as never, "1")).rejects.toMatchObject({
      status: 400,
    });
  });

  it("reports health", async () => {
    const fetchImpl = vi.fn<UpstreamFetch>(async (url: string) => {
      expect(url).toContain("/utility/health");
      return jsonResponse({ status: "ok", services: { tmdb: "ok", moviebox: "ok" } });
    });

    const health = await clientWith(fetchImpl).health();

    expect(health.status).toBe("ok");
  });

  it.each([
    [404, "surfaces unknown titles as a typed upstream 404"],
    [429, "surfaces rate limiting as a typed upstream 429"],
    [503, "surfaces upstream 5xx as a typed upstream error"],
  ] as const)("maps Spün %s", async (status, _label) => {
    const fetchImpl = vi.fn<UpstreamFetch>(async () => jsonResponse({ error: "nope" }, status));

    await expect(clientWith(fetchImpl).info("fight-club-828920")).rejects.toMatchObject({
      name: "UpstreamHttpError",
      status,
    });
  });

  it("maps network failures to a typed 502 upstream error", async () => {
    const fetchImpl = vi.fn<UpstreamFetch>(async () => {
      throw new TypeError("fetch failed");
    });

    await expect(clientWith(fetchImpl).search({ keyword: "x", page: 1 })).rejects.toMatchObject({
      name: "UpstreamHttpError",
      status: 502,
    });
  });

  it("passes a request timeout signal", async () => {
    const fetchImpl = vi.fn<UpstreamFetch>(async (_url: string, init?: RequestInit) => {
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      return jsonResponse(SEARCH_FIXTURE);
    });

    await clientWith(fetchImpl).search({ keyword: "x", page: 1 });
  });

  it("rejects malformed Spün payloads", async () => {
    const fetchImpl = vi.fn<UpstreamFetch>(async () => jsonResponse({ results: "not-an-array" }));

    await expect(clientWith(fetchImpl).search({ keyword: "x", page: 1 })).rejects.toThrow();
  });

  it("rejects malformed health payloads", async () => {
    const fetchImpl = vi.fn<UpstreamFetch>(async () => jsonResponse({ status: 123 }));

    await expect(clientWith(fetchImpl).health()).rejects.toThrow();
  });
});