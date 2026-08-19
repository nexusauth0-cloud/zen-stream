import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { MediaHomeFeed } from "@zen-stream/contracts";
import { WatchlistProvider } from "../store/watchlist";
import { ComingSoonPage } from "./ComingSoonPage";

function feedWithUpcoming(): MediaHomeFeed {
  return {
    total: 1,
    rows: [
      {
        title: "Action Picks",
        opId: "op-a",
        type: null,
        total: 2,
        subjects: [
          {
            subjectId: "movie-a",
            type: "movie",
            title: "Mousetrap",
            poster: null,
            hasResource: true,
            description: null,
            releaseDate: "2026-08-28",
            runtime: null,
            genre: null,
            rating: null,
            language: null,
            country: null,
          },
          {
            subjectId: "movie-b",
            type: "movie",
            title: "The Whisper Man",
            poster: null,
            hasResource: false,
            description: null,
            releaseDate: "2026-08-29",
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
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ComingSoonPage", () => {
  it("renders upcoming titles with their release dates", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(feedWithUpcoming())));
    render(
      <MemoryRouter>
        <WatchlistProvider>
          <ComingSoonPage />
        </WatchlistProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Coming Soon" })).toBeInTheDocument();
    });
    expect(screen.getByText("Mousetrap")).toBeInTheDocument();
    expect(screen.getByText("The Whisper Man")).toBeInTheDocument();
    expect(screen.getByText("2 titles on the way")).toBeInTheDocument();
  });

  it("hides upcoming titles that have already released", async () => {
    const feed = feedWithUpcoming();
    feed.rows[0]!.subjects[0]!.releaseDate = "2026-08-01";
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(feed)));
    render(
      <MemoryRouter>
        <WatchlistProvider>
          <ComingSoonPage />
        </WatchlistProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("The Whisper Man")).toBeInTheDocument();
    });
    expect(screen.queryByText("Mousetrap")).not.toBeInTheDocument();
  });

  it("shows a compact empty state when nothing is upcoming", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({ total: 1, rows: [{ title: "Row", opId: "op", type: null, total: 0, subjects: [] }] }),
      ),
    );
    render(
      <MemoryRouter>
        <WatchlistProvider>
          <ComingSoonPage />
        </WatchlistProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Nothing upcoming right now" })).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: "Browse the catalog" })).toHaveAttribute("href", "/");
  });

  it("shows an error state with retry on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ error: { code: "MEDIA_UPSTREAM_ERROR", message: "x" } }, 502)),
    );
    render(
      <MemoryRouter>
        <WatchlistProvider>
          <ComingSoonPage />
        </WatchlistProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});