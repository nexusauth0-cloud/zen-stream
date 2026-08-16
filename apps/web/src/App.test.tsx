import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "./App";
import { WatchlistProvider } from "./store/watchlist";

const HOME_FEED_BODY = {
  total: 1,
  rows: [
    {
      title: "Trending Now",
      opId: "op-1",
      type: null,
      total: 1,
      subjects: [
        {
          subjectId: "movie-1",
          type: "movie",
          title: "Harbor Lights",
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

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <WatchlistProvider>
        <AppRoutes />
      </WatchlistProvider>
    </MemoryRouter>,
  );
}

function mockHomeFeed() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      new Response(JSON.stringify(HOME_FEED_BODY), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ),
  );
}

describe("routing", () => {
  const cases = [
    { path: "/movies", title: "Movies", route: "/movies" },
    { path: "/series", title: "Series", route: "/series" },
    { path: "/search", title: "Search", route: "/search" },
    { path: "/my-list", title: "My List", route: "/my-list" },
    { path: "/history", title: "History", route: "/history" },
    { path: "/account", title: "Account", route: "/account" },
    { path: "/watch/123", title: "Watch", route: "/watch/:subjectId" },
  ] as const;

  it.each(cases)("renders the $title placeholder at $path", ({ path, title, route }) => {
    renderAt(path);

    expect(screen.getByRole("heading", { level: 1, name: title })).toBeInTheDocument();
    expect(screen.getByTestId("placeholder-page")).toBeInTheDocument();
    expect(screen.getByTestId("placeholder-route")).toHaveTextContent(route);
  });

  it("renders the API-driven discovery home at /", async () => {
    mockHomeFeed();
    renderAt("/");

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Harbor Lights" })).toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: "Trending Now" })).toBeInTheDocument();
    expect(screen.queryByTestId("placeholder-page")).not.toBeInTheDocument();
  });

  it("renders the not-found page for unknown routes", () => {
    renderAt("/does-not-exist");

    expect(screen.getByRole("heading", { level: 1, name: "Page not found" })).toBeInTheDocument();
    expect(screen.getByText(/this page does not exist/i)).toBeInTheDocument();
  });

  it("keeps a correct heading hierarchy with a single h1", async () => {
    mockHomeFeed();
    renderAt("/");

    await waitFor(() => {
      expect(screen.getAllByRole("heading").length).toBeGreaterThan(0);
    });
    const headings = screen.getAllByRole("heading");
    expect(headings.filter((h) => h.tagName === "H1")).toHaveLength(1);
    // No heading level is skipped: h1 followed by h2 sections.
    expect(headings.every((h) => ["H1", "H2"].includes(h.tagName))).toBe(true);
  });

  it("hides decorative navigation icons from assistive technology", async () => {
    mockHomeFeed();
    renderAt("/");

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Harbor Lights" })).toBeInTheDocument();
    });
    const main = screen.getByRole("main");
    expect(within(main).queryByRole("img")).not.toBeInTheDocument();
    // No icon is a meaningful role anywhere in the shell.
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});

describe("active navigation", () => {
  it("marks the active route with aria-current on the sidebar item", () => {
    renderAt("/movies");

    const sidebar = screen.getByRole("navigation", { name: "Primary navigation" });
    const movies = within(sidebar).getByRole("link", { name: "Movies" });
    expect(movies).toHaveAttribute("aria-current", "page");

    const home = within(sidebar).getByRole("link", { name: "Home" });
    expect(home).not.toHaveAttribute("aria-current");
  });

  it("marks the active route on the mobile bottom navigation", () => {
    renderAt("/my-list");

    const mobileNav = screen.getByRole("navigation", { name: "Mobile navigation" });
    const active = within(mobileNav).getByRole("link", { name: /My List/i });
    expect(active).toHaveAttribute("aria-current", "page");
  });
});