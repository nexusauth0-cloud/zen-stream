import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { WatchlistProvider } from "../store/watchlist";
import { WatchPage } from "./WatchPage";

const STREAM_BODY = {
  streams: [
    {
      quality: "HD",
      resolution: 1080,
      url: "https://cdn.example.com/stream.mp4",
      format: "mp4",
      size: null,
      codecName: null,
      duration: null,
      captions: [],
      se: 0,
      ep: 0,
    },
  ],
  total: 1,
};

const INFO_BODY = {
  subjectId: "123",
  subjectType: 2,
  title: "Series X",
  description: null,
  releaseDate: "2023-01-01",
  runtime: null,
  genre: null,
  poster: null,
  country: null,
  rating: null,
  hasResource: true,
  language: null,
  staff: [],
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Routes stubs by URL: metadata endpoints get info, /stream gets streams. */
function stubMedia(fetchMock: (url: string, init?: RequestInit) => Promise<Response>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) =>
      String(url).includes("/stream/") ? fetchMock(String(url)) : jsonResponse(INFO_BODY),
    ),
  );
  return fetchMock;
}

function renderWatch() {
  return render(
    <MemoryRouter initialEntries={["/watch/123"]}>
      <WatchlistProvider>
        <Routes>
          <Route path="/watch/:subjectId" element={<WatchPage />} />
        </Routes>
      </WatchlistProvider>
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WatchPage", () => {
  it("shows the player when a stream resolves", async () => {
    stubMedia(vi.fn(async () => jsonResponse(STREAM_BODY)));
    renderWatch();

    expect(await screen.findByLabelText("HD stream")).toBeInTheDocument();
  });

  it("refetches a fresh stream when playback fails instead of reusing the dead URL", async () => {
    const streamMock = vi.fn(async () => jsonResponse(STREAM_BODY));
    const fetchMock = stubMedia(streamMock);
    renderWatch();

    const video = await screen.findByLabelText("HD stream");
    expect(streamMock).toHaveBeenCalledTimes(1);

    // Signed upstream URLs expire; a failed decode must trigger a new
    // /stream request so the retried playback uses a fresh URL.
    fireEvent.error(video);
    expect(await screen.findByRole("alert")).toHaveTextContent(/playback failed/i);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(streamMock).toHaveBeenCalledTimes(2);
    expect(await screen.findByLabelText("HD stream")).toBeInTheDocument();
    expect(fetchMock).toBeDefined();
  });

  it("surfaces a transient fetch failure with a retry that refetches", async () => {
    const streamMock = vi.fn(async () =>
      jsonResponse({ error: { code: "MEDIA_UPSTREAM_ERROR", message: "temporary" } }, 502),
    );
    stubMedia(streamMock);
    renderWatch();

    expect(await screen.findByRole("alert")).toHaveTextContent(/unavailable right now/i);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(streamMock).toHaveBeenCalledTimes(2);
  });

  it("explains clearly when no stream is available", async () => {
    const streamMock = vi.fn(async () => jsonResponse({ streams: [], total: 0 }));
    stubMedia(streamMock);
    renderWatch();

    expect(
      await screen.findByRole("heading", { name: "Nothing to play yet" }),
    ).toBeInTheDocument();
  });
});

describe("WatchPage availability guard", () => {
  function renderWatchWithInfo(info: Record<string, unknown>) {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        String(url).includes("/stream/")
          ? jsonResponse(STREAM_BODY)
          : jsonResponse({ ...INFO_BODY, ...info }),
      ),
    );
    renderWatch();
  }

  it("never reaches the player for a coming-soon title", async () => {
    renderWatchWithInfo({ releaseDate: "2026-09-01", hasResource: true });

    expect(
      await screen.findByRole("heading", { name: "Coming Soon" }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("HD stream")).not.toBeInTheDocument();
  });

  it("offers Save and Back to details for an upcoming title", async () => {
    renderWatchWithInfo({ releaseDate: "2026-09-01" });

    expect(
      await screen.findByRole("heading", { name: "Coming Soon" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Available Sep 1, 2026/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to details" })).toHaveAttribute(
      "href",
      "/series/123",
    );
  });

  it("shows Playback unavailable for titles with nothing at all", async () => {
    renderWatchWithInfo({ releaseDate: null, hasResource: false });

    expect(
      await screen.findByRole("heading", { name: "Playback unavailable" }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("HD stream")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("plays normally when the info fetch fails (upstream blip)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        String(url).includes("/stream/")
          ? jsonResponse(STREAM_BODY)
          : jsonResponse({ error: { code: "MEDIA_UPSTREAM_ERROR", message: "x" } }, 502),
      ),
    );
    renderWatch();

    expect(await screen.findByLabelText("HD stream")).toBeInTheDocument();
  });
});
