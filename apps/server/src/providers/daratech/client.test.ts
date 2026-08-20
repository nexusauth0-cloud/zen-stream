import { describe, expect, it, vi } from "vitest";
import { createDaratechClient } from "./client.js";
import type { UpstreamFetch } from "../../media/client.js";

const CONFIG = { apiKey: "dara-test-key", apiRoot: "https://apimovie.runflix.name.ng/v1" };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function clientWith(fetchImpl: UpstreamFetch) {
  return createDaratechClient(CONFIG, fetchImpl);
}

const SEARCH_FIXTURE = {
  items: [
    {
      id: "NjAyNjQxMjIzMjk2NjM4OTkwNDo6OnBpY2E",
      subjectId: "NjAyNjQxMjIzMjk2NjM4OTkwNDo6OnBpY2E",
      title: "Spider-Man: Brand New Day",
      cover: "https://pbcdn.aoneroom.com/image/x.jpg",
      year: 2026,
      rating: 7.9,
      genres: ["Action"],
      subjectType: 1,
      language: "English",
      country: "United States",
    },
  ],
};

const DETAIL_FIXTURE = {
  id: "NjAyNjQxMjIzMjk2NjM4OTkwNDo6OnBpY2E",
  subjectId: "NjAyNjQxMjIzMjk2NjM4OTkwNDo6OnBpY2E",
  title: "Spider-Man: Brand New Day",
  cover: "https://pbcdn.aoneroom.com/image/x.jpg",
  backdrop: "https://pbcdn.aoneroom.com/image/b.jpg",
  year: 2026,
  rating: 7.9,
  genres: ["Action", "Adventure"],
  description: "The web-slinger returns.",
  category: "Movies",
  subjectType: 1,
  language: "English",
  country: "United States",
  cast: [{ name: "Tom Holland", role: "Spider-Man", photo: "https://pbcdn/photo.jpg" }],
  stills: [{ url: "https://pbcdn/still.jpg" }],
  related: [],
  trailer: null,
};

describe("createDaratechClient", () => {
  it("attaches the bearer key to every request", async () => {
    const fetchImpl = vi.fn<UpstreamFetch>(async (url: string, init?: RequestInit) => {
      expect(init?.headers).toMatchObject({ Authorization: "Bearer dara-test-key" });
      return jsonResponse(SEARCH_FIXTURE);
    });

    await clientWith(fetchImpl).search({ keyword: "spider-man", page: 1 });

    expect(String(fetchImpl.mock.calls[0]?.[0])).toContain("/v1/search?q=spider-man&page=1");
  });

  it("searches and validates the response", async () => {
    const page = await clientWith(vi.fn<UpstreamFetch>(async () => jsonResponse(SEARCH_FIXTURE))).search({
      keyword: "spider-man",
      page: 1,
    });

    expect(page.items[0]).toMatchObject({ subjectType: 1, title: "Spider-Man: Brand New Day" });
  });

  it("fetches universal detail by id", async () => {
    const fetchImpl = vi.fn<UpstreamFetch>(async (url: string) => {
      expect(url).toContain("/v1/detail/NjAyNjQxMjIzMjk2NjM4OTkwNDo6OnBpY2E");
      return jsonResponse(DETAIL_FIXTURE);
    });

    const detail = await clientWith(fetchImpl).detail("NjAyNjQxMjIzMjk2NjM4OTkwNDo6OnBpY2E");

    expect(detail).toMatchObject({ title: "Spider-Man: Brand New Day", subjectType: 1 });
    expect(detail.cast[0]).toMatchObject({ name: "Tom Holland", role: "Spider-Man" });
  });

  it("reports health without auth", async () => {
    const fetchImpl = vi.fn<UpstreamFetch>(async (url: string, init?: RequestInit) => {
      expect(url).toContain("/v1/health");
      expect(init?.headers).toMatchObject({ Authorization: "Bearer dara-test-key" });
      return jsonResponse({ status: "ok", success: true });
    });

    const health = await clientWith(fetchImpl).health();

    expect(health.status).toBe("ok");
  });

  it.each([
    [401, "rejects a bad key"],
    [403, "rejects a forbidden key"],
  ] as const)("maps DaraTech %s to a typed upstream error", async (status, _label) => {
    const fetchImpl = vi.fn<UpstreamFetch>(async () => jsonResponse({ error: "denied" }, status));

    await expect(clientWith(fetchImpl).search({ keyword: "x", page: 1 })).rejects.toMatchObject({
      name: "UpstreamHttpError",
      status,
    });
  });

  it("maps DaraTech 429 rate limiting to a typed upstream error", async () => {
    const fetchImpl = vi.fn<UpstreamFetch>(async () =>
      jsonResponse({ error: "Too many requests" }, 429),
    );

    await expect(clientWith(fetchImpl).search({ keyword: "x", page: 1 })).rejects.toMatchObject({
      name: "UpstreamHttpError",
      status: 429,
    });
  });

  it("maps DaraTech 5xx responses to a typed upstream error", async () => {
    const fetchImpl = vi.fn<UpstreamFetch>(async () => jsonResponse({ error: "boom" }, 503));

    await expect(clientWith(fetchImpl).detail("NjAyNjQxMjIzMjk2NjM4OTkwNDo6OnBpY2E")).rejects.toMatchObject({
      name: "UpstreamHttpError",
      status: 503,
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

  it("rejects malformed DaraTech payloads", async () => {
    const fetchImpl = vi.fn<UpstreamFetch>(async () => jsonResponse({ items: "not-an-array" }));

    await expect(clientWith(fetchImpl).search({ keyword: "x", page: 1 })).rejects.toThrow();
  });
});