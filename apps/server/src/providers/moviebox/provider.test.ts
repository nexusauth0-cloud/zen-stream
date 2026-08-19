import { describe, expect, it, vi } from "vitest";
import { createMovieBoxProvider } from "./provider.js";
import type { UpstreamFetch } from "../../media/client.js";
import { UpstreamHttpError } from "../../media/client.js";

const CONFIG = { baseUrl: "https://upstream.example/", secret: "s3cret" };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

describe("createMovieBoxProvider", () => {
  it("adapts the upstream client without changing contracts", async () => {
    const fetchImpl: UpstreamFetch = vi.fn(async (url: string) => {
      if (url.endsWith("/home")) {
        return jsonResponse({ total: 1, rows: [] });
      }
      if (url.endsWith("/info/123")) {
        return jsonResponse({ subjectId: "123", subjectType: 2, title: "Series X" });
      }
      if (url.includes("/stream/123")) {
        return jsonResponse({
          streams: [{ quality: "720p", resolution: 720, url: "https://cdn.example/v.mp4" }],
          total: 1,
        });
      }
      throw new Error(`unexpected url ${url}`);
    });

    const provider = createMovieBoxProvider(CONFIG, fetchImpl);

    expect(provider.id).toBe("moviebox");
    expect(provider.name).toBe("MovieBox");

    const home = await provider.fetchHome();
    expect(home.total).toBe(1);

    const info = await provider.fetchInfo("123");
    expect(info.type).toBe("series");
    expect(info.title).toBe("Series X");

    const stream = await provider.fetchStream("123", { se: 0, ep: 0 });
    expect(stream.streams[0]?.resolution).toBe(720);
  });

  it("attaches the secret header on every request", async () => {
    const fetchImpl: UpstreamFetch = vi.fn(async (url: string, init?: RequestInit) => {
      expect(init?.headers).toMatchObject({ "X-Worker-Secret": "s3cret" });
      return jsonResponse({ total: 0, rows: [] });
    });

    const provider = createMovieBoxProvider(CONFIG, fetchImpl);
    await provider.fetchHome();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("propagates upstream failures unchanged", async () => {
    const fetchImpl: UpstreamFetch = vi.fn(async () => jsonResponse({ error: "boom" }, 502));
    const provider = createMovieBoxProvider(CONFIG, fetchImpl);

    await expect(provider.fetchHome()).rejects.toThrow(UpstreamHttpError);
    await expect(provider.fetchHome()).rejects.toMatchObject({ status: 502 });
  });
});