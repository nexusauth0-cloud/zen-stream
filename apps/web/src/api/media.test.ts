import { afterEach, describe, expect, it, vi } from "vitest";
import { MediaApiError, fetchJson } from "./client";
import {
  fetchHomeFeed,
  fetchMediaInfo,
  fetchSeason,
  fetchStream,
  searchMedia,
} from "./media";

const MEDIA_BODY = {
  total: 1,
  rows: [
    {
      title: "Nollywood Movie",
      opId: "op-1",
      type: "SUBJECTS_MOVIE",
      total: 1,
      subjects: [
        {
          subjectId: "6021098917113354936",
          type: "movie",
          title: "YOURS BEFORE WORDS",
          poster: null,
          hasResource: true,
          description: null,
          releaseDate: null,
          runtime: null,
          genre: null,
          rating: null,
          language: null,
          country: null,
        },
      ],
    },
  ],
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchJson", () => {
  it("returns parsed JSON on success", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ status: "ok" })));

    await expect(fetchJson<{ status: string }>("/api/v1/health")).resolves.toEqual({
      status: "ok",
    });
  });

  it("throws a typed error with the server code on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({ error: { code: "MEDIA_UPSTREAM_ERROR", message: "down" } }, 502),
      ),
    );

    const error = await fetchJson("/api/v1/media/home").catch((value: unknown) => value);

    expect(error).toBeInstanceOf(MediaApiError);
    expect(error).toMatchObject({ status: 502, code: "MEDIA_UPSTREAM_ERROR" });
  });

  it("maps network failures to a typed network error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("fetch failed"))));

    const error = await fetchJson("/api/v1/media/home").catch((value: unknown) => value);

    expect(error).toMatchObject({ status: 0, code: "NETWORK_ERROR" });
  });

  it("rethrows AbortError so callers can ignore cancellations", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Promise.reject(new DOMException("aborted", "AbortError"))),
    );

    await expect(fetchJson("/api/v1/media/home")).rejects.toMatchObject({
      name: "AbortError",
    });
  });
});

describe("media endpoints", () => {
  it("fetches the home feed from the proxy", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => jsonResponse(MEDIA_BODY));
    vi.stubGlobal("fetch", fetchMock);

    const feed = await fetchHomeFeed();

    expect(feed.rows[0]!.subjects[0]!.title).toBe("YOURS BEFORE WORDS");
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/media/home", expect.objectContaining({}));
  });

  it("encodes search params into the query string", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => jsonResponse({ items: [], pager: {} }));
    vi.stubGlobal("fetch", fetchMock);

    await searchMedia({ keyword: "avatar movie", page: 2, perPage: 10 });

    const [url] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/v1/media/search?q=avatar+movie&page=2&perPage=10");
  });

  it("encodes subject ids in info and season paths", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => jsonResponse({ seasons: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchSeason("a b/c");

    expect(fetchMock.mock.calls[0]![0]).toBe("/api/v1/media/season/a%20b%2Fc");
  });

  it("passes se/ep to the stream endpoint", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => jsonResponse({ streams: [], total: 0 }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchStream("123", { se: 5, ep: 8 });

    expect(fetchMock.mock.calls[0]![0]).toBe("/api/v1/media/stream/123?se=5&ep=8");
  });

  it("forwards abort signals", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();

    await fetchMediaInfo("123", controller.signal);

    expect(fetchMock.mock.calls[0]![1]).toMatchObject({ signal: controller.signal });
  });
});