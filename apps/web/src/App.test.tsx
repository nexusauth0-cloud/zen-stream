import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "./App";
import { WatchlistProvider } from "./store/watchlist";

const HOME_FEED_BODY = {
  total: 5,
  rows: [
    {
      title: "Trending Now",
      opId: "op-trending",
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
    {
      title: "Popular Movies",
      opId: "op-movies",
      type: "SUBJECTS_MOVIE",
      total: 1,
      subjects: [
        {
          subjectId: "movie-2",
          type: "movie",
          title: "Midnight Express",
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
    {
      title: "Anime[English Dubbed]",
      opId: "op-anime",
      type: null,
      total: 1,
      subjects: [
        {
          subjectId: "series-2",
          type: "series",
          title: "Shonen Rising",
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
    {
      title: "New Series",
      opId: "op-series",
      type: "SUBJECTS_TV",
      total: 1,
      subjects: [
        {
          subjectId: "series-1",
          type: "series",
          title: "Night Shift",
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
    {
      title: "Empty Banner Row",
      opId: "op-empty",
      type: "CUSTOM",
      total: 0,
      subjects: [],
    },
  ],
};

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

function mockResponse(body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ),
  );
}

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

function mockHomeFeed() {
  mockResponse(HOME_FEED_BODY);
}

describe("routing", () => {
  const placeholderCases = [
    { path: "/history", title: "History", route: "/history" },
    { path: "/account", title: "Account", route: "/account" },
  ] as const;

  it.each(placeholderCases)("renders the $title placeholder at $path", ({ path, title, route }) => {
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
    expect(screen.queryByRole("heading", { name: "Empty Banner Row" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("placeholder-page")).not.toBeInTheDocument();
  });

  it("renders the movie browse page at /movies", async () => {
    mockHomeFeed();
    renderAt("/movies");

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Movies" })).toBeInTheDocument();
    });
    expect(await screen.findByRole("link", { name: "Midnight Express" })).toBeInTheDocument();
    // Series-only rows are excluded from the movie catalog.
    expect(screen.queryByRole("heading", { name: "New Series" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Anime[English Dubbed]" })).not.toBeInTheDocument();
  });

  it("renders the series browse page at /series", async () => {
    mockHomeFeed();
    renderAt("/series");

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "TV Series" })).toBeInTheDocument();
    });
    expect(await screen.findByRole("link", { name: "Night Shift" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Anime[English Dubbed]" })).toBeInTheDocument();
    // Movie-only rows are excluded from the series catalog.
    expect(screen.queryByRole("heading", { name: "Popular Movies" })).not.toBeInTheDocument();
  });

  it("renders the search page at /search", () => {
    renderAt("/search");

    expect(screen.getByRole("heading", { level: 1, name: "Search movies and TV shows" })).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Search the catalog" })).toBeInTheDocument();
  });

  it("shows real popular rails on the search page before a query", async () => {
    mockHomeFeed();
    renderAt("/search");

    expect(
      await screen.findByRole("heading", { name: "Popular movies" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Popular series" })).toBeInTheDocument();
  });

  it("renders the genres page with real categories at /genres", async () => {
    mockHomeFeed();
    renderAt("/genres");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Genres & Categories" }),
    ).toBeInTheDocument();
    const main = screen.getByRole("main");
    const links = within(main).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/collection/op-trending",
      "/collection/op-movies",
      "/collection/op-anime",
      "/collection/op-series",
    ]);
  });

  it("renders the animation catalog at /animation", async () => {
    mockHomeFeed();
    renderAt("/animation");

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Animation" })).toBeInTheDocument();
    });
    expect(
      await screen.findByRole("heading", { name: "Anime[English Dubbed]" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Shonen Rising" })).toBeInTheDocument();
  });

  it("renders the most watched catalog at /most-watched", async () => {
    mockHomeFeed();
    renderAt("/most-watched");

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Most Watched" })).toBeInTheDocument();
    });
    expect(await screen.findByRole("heading", { name: "Trending Now" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Popular Movies" })).toBeInTheDocument();
  });

  it("renders the empty my-list page at /my-list", () => {
    renderAt("/my-list");

    expect(screen.getByRole("heading", { level: 1, name: "My List" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Your list is empty" })).toBeInTheDocument();
  });

  it("renders the player at /watch/123", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        const body = String(url).includes("/stream/") ? STREAM_BODY : INFO_BODY;
        return new Response(JSON.stringify(body), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }),
    );
    renderAt("/watch/123");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Now playing" })).toBeInTheDocument();
    });
    expect(screen.getByLabelText("HD stream")).toBeInTheDocument();
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
  it("marks the active route with aria-current on the header nav item", () => {
    renderAt("/movies");

    const headerNav = screen.getByRole("navigation", { name: "Primary navigation" });
    const movies = within(headerNav).getByRole("link", { name: "Movies" });
    expect(movies).toHaveAttribute("aria-current", "page");

    const home = within(headerNav).getByRole("link", { name: "Home" });
    expect(home).not.toHaveAttribute("aria-current");
  });

  it("marks the active route on the mobile bottom navigation", () => {
    renderAt("/my-list");

    const mobileNav = screen.getByRole("navigation", { name: "Mobile navigation" });
    const active = within(mobileNav).getByRole("link", { name: /My List/i });
    expect(active).toHaveAttribute("aria-current", "page");
  });
});