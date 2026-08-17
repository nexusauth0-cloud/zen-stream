import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
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

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function renderWatch() {
  return render(
    <MemoryRouter initialEntries={["/watch/123"]}>
      <Routes>
        <Route path="/watch/:subjectId" element={<WatchPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WatchPage", () => {
  it("shows the player when a stream resolves", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(STREAM_BODY)));
    renderWatch();

    expect(await screen.findByLabelText("HD stream")).toBeInTheDocument();
  });

  it("refetches a fresh stream when playback fails instead of reusing the dead URL", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(STREAM_BODY));
    vi.stubGlobal("fetch", fetchMock);
    renderWatch();

    const video = await screen.findByLabelText("HD stream");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Signed upstream URLs expire; a failed decode must trigger a new
    // /stream request so the retried playback uses a fresh URL.
    fireEvent.error(video);
    expect(await screen.findByRole("alert")).toHaveTextContent(/playback failed/i);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(await screen.findByLabelText("HD stream")).toBeInTheDocument();
  });

  it("surfaces a transient fetch failure with a retry that refetches", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ error: { code: "MEDIA_UPSTREAM_ERROR", message: "temporary" } }, 502),
    );
    vi.stubGlobal("fetch", fetchMock);
    renderWatch();

    expect(await screen.findByRole("alert")).toHaveTextContent(/unavailable right now/i);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("explains clearly when no stream is available", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ streams: [], total: 0 })));
    renderWatch();

    expect(
      await screen.findByRole("heading", { name: "Nothing to play yet" }),
    ).toBeInTheDocument();
  });
});
