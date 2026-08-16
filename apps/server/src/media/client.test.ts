import { afterEach, describe, expect, it, vi } from "vitest";
import { createMediaClient, UpstreamHttpError } from "./client.js";
import type { UpstreamFetch } from "./client.js";

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
      "https://media.example/api/v1/home",
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
      "https://media.example/api/v1/home/rows",
      expect.anything(),
    );
  });

  it("posts search params as JSON", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ items: [], pager: {} }));
    const client = createMediaClient(CONFIG, fetchImpl as unknown as UpstreamFetch);

    await client.fetchSearch({ keyword: "avatar", page: 1, perPage: 20 });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://media.example/api/v1/search",
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
      "https://media.example/api/v1/season/a%20b%2Fc",
      expect.anything(),
    );
  });

  it("passes se/ep through to the stream endpoint", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ streams: [], total: 0 }));
    const client = createMediaClient(CONFIG, fetchImpl as unknown as UpstreamFetch);

    await client.fetchStream("123", { se: 5, ep: 8 });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://media.example/api/v1/stream/123?se=5&ep=8",
      expect.anything(),
    );
  });
});