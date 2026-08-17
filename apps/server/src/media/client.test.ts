import { afterEach, describe, expect, it, vi } from "vitest";
import { createMediaClient, UpstreamHttpError } from "./client.js";
import type { UpstreamFetch } from "./client.js";
import type {
  MediaHomeFeed,
  MediaSearchResponse,
  MediaStreamResponse,
} from "@zen-stream/contracts";

const CONFIG = { baseUrl: "https://media.example/", secret: "s3cret" };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("createMediaClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("attaches the secret header to every upstream request", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ total: 0, rows: [] }));
    const client = createMediaClient(CONFIG, fetchImpl as unknown as UpstreamFetch);

    await client.fetchHome();

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://media.example/home",
      expect.objectContaining({
        headers: expect.objectContaining({ "X-Worker-Secret": "s3cret" }),
      }),
    );
  });

  it("strips the trailing slash from the configured base url", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ total: 0, rows: [] }));
    const client = createMediaClient(
      { baseUrl: "https://media.example/", secret: "s3cret" },
      fetchImpl as unknown as UpstreamFetch,
    );

    await client.fetchHomeRows();

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://media.example/home/rows",
      expect.anything(),
    );
  });

  it("posts search params as JSON", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ items: [], pager: {} }));
    const client = createMediaClient(CONFIG, fetchImpl as unknown as UpstreamFetch);

    await client.fetchSearch({ keyword: "avatar", page: 1, perPage: 20 });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://media.example/search",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        body: JSON.stringify({ keyword: "avatar", page: 1, perPage: 20 }),
      }),
    );
  });

  it("throws a typed error on non-2xx upstream responses", async () => {
    const fetchImpl = vi.fn(async () => new Response("boom", { status: 500 }));
    const client = createMediaClient(CONFIG, fetchImpl as unknown as UpstreamFetch);

    await expect(client.fetchHome()).rejects.toBeInstanceOf(UpstreamHttpError);
    await expect(client.fetchHome()).rejects.toMatchObject({ status: 500 });
  });

  it("maps a non-JSON upstream body to a retryable typed error", async () => {
    const fetchImpl = vi.fn(async () => new Response("<html>gateway</html>", { status: 200 }));
    const client = createMediaClient(CONFIG, fetchImpl as unknown as UpstreamFetch);

    await expect(client.fetchHome()).rejects.toBeInstanceOf(UpstreamHttpError);
    await expect(client.fetchHome()).rejects.toMatchObject({ status: 200 });
  });

  it("validates the upstream home payload against the contract", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ total: 1, rows: [] }));
    const client = createMediaClient(CONFIG, fetchImpl as unknown as UpstreamFetch);

    const feed = await client.fetchHome();
    expect(feed).toEqual({ total: 1, rows: [] });
  });

  it("rejects malformed upstream payloads", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ rows: "not-an-array" }));
    const client = createMediaClient(CONFIG, fetchImpl as unknown as UpstreamFetch);

    await expect(client.fetchHome()).rejects.toThrow();
  });

  it("encodes subject ids in the path", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ seasons: [] }));
    const client = createMediaClient(CONFIG, fetchImpl as unknown as UpstreamFetch);

    await client.fetchSeason("a b/c");

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://media.example/season/a%20b%2Fc",
      expect.anything(),
    );
  });

  it("passes se/ep through to the stream endpoint", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ streams: [], total: 0 }));
    const client = createMediaClient(CONFIG, fetchImpl as unknown as UpstreamFetch);

    await client.fetchStream("123", { se: 5, ep: 8 });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://media.example/stream/123?se=5&ep=8",
      expect.anything(),
    );
  });

  it("accepts a realistic worker home payload", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        total: 1,
        rows: [
          {
            title: "Nollywood Movie",
            opId: "359580746379676048",
            type: "SUBJECTS_MOVIE",
            total: 1,
            subjects: [
              {
                subjectId: "6021098917113354936",
                subjectType: 1,
                type: "movie",
                title: "YOURS BEFORE WORDS",
                description: "",
                releaseDate: "2026-06-09",
                runtime: null,
                genre: "drama",
                poster: "https://pbcdn.example/p.jpg",
                thumbnail: "",
                country: "Nigeria",
                rating: null,
                hasResource: true,
                language: null,
              },
            ],
          },
        ],
      }),
    );
    const client = createMediaClient(CONFIG, fetchImpl as unknown as UpstreamFetch);

    const feed = (await client.fetchHome()) as MediaHomeFeed;

    expect(feed.rows[0]!.title).toBe("Nollywood Movie");
    expect(feed.rows[0]!.subjects[0]).toMatchObject({
      subjectId: "6021098917113354936",
      type: "movie",
      hasResource: true,
      country: "Nigeria",
    });
    expect(fetchImpl).toHaveBeenCalledWith("https://media.example/home", expect.anything());
  });

  it("accepts a null pager from the worker (empty search)", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ items: [], pager: null }));
    const client = createMediaClient(CONFIG, fetchImpl as unknown as UpstreamFetch);

    const result = (await client.fetchSearch({
      keyword: "zzzz",
      page: 1,
      perPage: 20,
    })) as MediaSearchResponse;

    expect(result.items).toEqual([]);
    expect(result.pager.hasMore).toBe(false);
  });

  it("accepts object-shaped stream captions from the worker", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        streams: [
          {
            quality: "1080p",
            resolution: 1080,
            url: "https://spun-moviebox-relay.example/media/x?e=1&s=2",
            filename: null,
            format: "mp4",
            size: "426 MB",
            codecName: "hevc",
            duration: 4005,
            captions: [{ language: "English", language_code: "en", url: "https://cdn.example/en.vtt" }],
            se: 5,
            ep: 8,
          },
        ],
        total: 1,
      }),
    );
    const client = createMediaClient(CONFIG, fetchImpl as unknown as UpstreamFetch);

    const result = (await client.fetchStream("5139196938264400928", {
      se: 5,
      ep: 8,
    })) as MediaStreamResponse;

    expect(result.streams[0]).toMatchObject({
      quality: "1080p",
      resolution: 1080,
      se: 5,
      ep: 8,
      captions: [{ language: "English", language_code: "en", url: "https://cdn.example/en.vtt" }],
    });
  });
});