import { describe, expect, it, vi } from "vitest";
import { createDaratechProvider } from "./provider.js";
import type { UpstreamFetch } from "../../media/client.js";

const CONFIG = { apiKey: "dara-test-key", apiRoot: "https://apimovie.runflix.name.ng/v1" };

const SPIDERMAN_DARATECH_ID = "NjAyNjQxMjIzMjk2NjM4OTkwNDo6OnBpY2E";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function daratechFetch(fixtures: Record<string, unknown>): UpstreamFetch {
  return vi.fn<UpstreamFetch>(async (url: string) => {
    for (const [suffix, body] of Object.entries(fixtures)) {
      if (url.includes(suffix)) return jsonResponse(body);
    }
    throw new Error(`unexpected daratech url ${url}`);
  });
}

const SEARCH_FIXTURE = {
  items: [
    {
      id: SPIDERMAN_DARATECH_ID,
      subjectId: SPIDERMAN_DARATECH_ID,
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
  id: SPIDERMAN_DARATECH_ID,
  subjectId: SPIDERMAN_DARATECH_ID,
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

describe("createDaratechProvider", () => {
  it("exposes DaraTech through the secondary metadata provider interface", async () => {
    const provider = createDaratechProvider(CONFIG, daratechFetch({ "/v1/search?": SEARCH_FIXTURE }));

    expect(provider.id).toBe("daratech");
    expect(provider.name).toBe("DaraTech");

    const response = await provider.fetchSearch({ keyword: "spider-man", page: 1, perPage: 20 });
    expect(response.items[0]).toMatchObject({
      subjectId: SPIDERMAN_DARATECH_ID,
      type: "movie",
      title: "Spider-Man: Brand New Day",
      genre: "Action",
    });
  });

  it("fetches movie details by MovieBox numeric id (base64 translation)", async () => {
    const fetchImpl = daratechFetch({ "/v1/detail/NjAyNjQxMjIzMjk2NjM4OTkwNDo6OnBpY2E": DETAIL_FIXTURE });
    const provider = createDaratechProvider(CONFIG, fetchImpl);

    const info = await provider.fetchInfo("6026412232966389904");

    expect(info).toMatchObject({
      subjectId: "6026412232966389904",
      type: "movie",
      title: "Spider-Man: Brand New Day",
      backdrop: "https://pbcdn.aoneroom.com/image/b.jpg",
      hasResource: false,
      genre: "Action, Adventure",
    });
    expect(info.externalIds).toMatchObject({
      moviebox: "6026412232966389904",
      daratech: SPIDERMAN_DARATECH_ID,
    });
    expect(info.staff[0]).toMatchObject({ name: "Tom Holland", role: "Spider-Man" });
  });

  it("fetches details directly for a DaraTech base64 id", async () => {
    const fetchImpl = daratechFetch({ "/v1/detail/NjAyNjQxMjIzMjk2NjM4OTkwNDo6OnBpY2E": DETAIL_FIXTURE });
    const provider = createDaratechProvider(CONFIG, fetchImpl);

    const info = await provider.fetchInfo(SPIDERMAN_DARATECH_ID);

    expect(info.subjectId).toBe(SPIDERMAN_DARATECH_ID);
    expect(info.externalIds).toMatchObject({
      moviebox: "6026412232966389904",
      daratech: SPIDERMAN_DARATECH_ID,
    });
    expect(info.hasResource).toBe(false);
  });

  it("treats foreign subject ids as not found without contacting DaraTech", async () => {
    const fetchImpl = vi.fn<UpstreamFetch>(async () => {
      throw new Error("should not be called");
    });
    const provider = createDaratechProvider(CONFIG, fetchImpl);

    await expect(provider.fetchInfo("fight-club-828920")).rejects.toMatchObject({ status: 404 });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("reports healthy when the health endpoint answers ok", async () => {
    const provider = createDaratechProvider(CONFIG, daratechFetch({ "/v1/health": { status: "ok" } }));

    expect(await provider.health!()).toBe("healthy");
  });

  it("reports offline when the health endpoint fails", async () => {
    const fetchImpl = vi.fn<UpstreamFetch>(async () => {
      throw new TypeError("fetch failed");
    });
    const provider = createDaratechProvider(CONFIG, fetchImpl);

    expect(await provider.health!()).toBe("offline");
  });
});