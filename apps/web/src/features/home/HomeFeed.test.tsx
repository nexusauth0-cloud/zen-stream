import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { MediaHomeFeed } from "@zen-stream/contracts";
import { WatchlistProvider } from "../../store/watchlist";
import { HomeFeed, heroSubject } from "./HomeFeed";

function feed(): MediaHomeFeed {
  return {
    total: 3,
    rows: [
      {
        title: "Nollywood Movie",
        opId: "op-1",
        type: "SUBJECTS_MOVIE",
        total: 1,
        subjects: [
          {
            subjectId: "movie-1",
            type: "movie",
            title: "YOURS BEFORE WORDS",
            poster: "https://cdn.example/p.jpg",
            hasResource: true,
            description: "A drama.",
            releaseDate: "2026-06-09",
            runtime: 112,
            genre: "Drama",
            rating: 8.2,
            language: null,
            country: "Nigeria",
          },
        ],
      },
      {
        title: "Anime[English Dubbed]",
        opId: "op-2",
        type: "SUBJECTS_TV",
        total: 1,
        subjects: [
          {
            subjectId: "series-1",
            type: "series",
            title: "Series X",
            poster: null,
            hasResource: false,
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
      {
        // Structural row without subjects — must never render an empty rail.
        title: "Classic Anime",
        opId: "op-3",
        type: "CUSTOM",
        total: 0,
        subjects: [],
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

function renderHome() {
  return render(
    <MemoryRouter>
      <WatchlistProvider>
        <HomeFeed />
      </WatchlistProvider>
    </MemoryRouter>,
  );
}

describe("heroSubject", () => {
  it("prefers an item with an available resource", () => {
    expect(heroSubject(feed())?.subjectId).toBe("movie-1");
  });

  it("falls back to the first subject when nothing has a resource", () => {
    const allUnavailable: MediaHomeFeed = {
      total: 1,
      rows: [
        {
          title: "Row",
          opId: "op",
          type: null,
          total: 1,
          subjects: [
            {
              subjectId: "x",
              type: "series",
              title: "X",
              poster: null,
              hasResource: false,
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
    expect(heroSubject(allUnavailable)?.subjectId).toBe("x");
  });
});

describe("HomeFeed", () => {
  it("shows skeletons while loading", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));
    renderHome();

    expect(screen.getByRole("status", { name: "Loading featured content" })).toBeInTheDocument();
    expect(screen.getAllByRole("status", { name: "Loading Popular Movies" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("status", { name: "Loading Popular Series" }).length).toBeGreaterThan(0);
  });

  it("renders the hero and one rail per row from real data", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(feed())));
    renderHome();

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "YOURS BEFORE WORDS" })).toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: "Nollywood Movie" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Anime[English Dubbed]" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See all movies" })).toHaveAttribute("href", "/movies");
    expect(screen.getByRole("link", { name: "See all series" })).toHaveAttribute("href", "/series");
    expect(screen.queryByRole("heading", { name: "Classic Anime" })).not.toBeInTheDocument();
  });

  it("shows an empty state when every row is empty", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          total: 1,
          rows: [{ title: "Classic Anime", opId: "op-3", type: "CUSTOM", total: 0, subjects: [] }],
        }),
      ),
    );
    renderHome();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Nothing to discover yet" })).toBeInTheDocument();
    });
  });

  it("shows an error state with retry on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ error: { code: "MEDIA_UPSTREAM_ERROR", message: "x" } }, 502)),
    );
    renderHome();

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("shows an empty state when the feed has no rows", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ total: 0, rows: [] })));
    renderHome();

    await waitFor(() => {
      expect(screen.getByRole("status")).toBeInTheDocument();
    });
  });
});