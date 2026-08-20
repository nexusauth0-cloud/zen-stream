import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { MediaSubjectSummary } from "@zen-stream/contracts";
import { WATCHLIST_STORAGE_KEY, WatchlistProvider } from "../store/watchlist";
import { rememberSubject } from "../api/subjectCache";
import { HomeFeed } from "../features/home/HomeFeed";
import { ComingSoonDetails } from "../components/media/ComingSoonDetails";
import { MoviePage } from "./MoviePage";
import { MyListPage } from "./MyListPage";
import { SearchPage } from "./SearchPage";
import { SeriesDetailPage } from "./SeriesDetailPage";
import { WatchPage } from "./WatchPage";

const UPCOMING: MediaSubjectSummary = {
  subjectId: "spiderman-2",
  type: "movie",
  title: "Spider-Man 2",
  poster: null,
  hasResource: false,
  description: null,
  releaseDate: "2026-08-28",
  runtime: null,
  genre: null,
  rating: null,
  language: null,
  country: null,
};

const UPCOMING_SERIES: MediaSubjectSummary = {
  subjectId: "reacher-3",
  type: "series",
  title: "Reacher 3",
  poster: null,
  hasResource: false,
  description: null,
  releaseDate: "2026-09-01",
  runtime: null,
  genre: null,
  rating: null,
  language: null,
  country: null,
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Every metadata endpoint fails; only explicitly provided URLs resolve. */
function stubFailures(okUrls: Record<string, Response> = {}) {
  const fetchMock = vi.fn(async (url: string) => {
    for (const [needle, response] of Object.entries(okUrls)) {
      if (String(url).includes(needle)) return response;
    }
    return jsonResponse({ error: { code: "MEDIA_UPSTREAM_ERROR", message: "upstream down" } }, 502);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderRoute(path: string, element: React.ReactNode) {
  const routePattern = path.startsWith("/movie/")
    ? "/movie/:subjectId"
    : path.startsWith("/series/")
      ? "/series/:subjectId"
      : path.startsWith("/watch/")
        ? "/watch/:subjectId"
        : path.split("?")[0];
  return render(
    <WatchlistProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={routePattern} element={element} />
        </Routes>
      </MemoryRouter>
    </WatchlistProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

/** jsdom lacks the Web Share API; expose it so ShareButton renders. */
function stubShareApi() {
  Object.defineProperty(navigator, "share", { value: vi.fn(), configurable: true });
  Object.defineProperty(navigator, "canShare", { value: () => true, configurable: true });
}

describe("Coming Soon resilience", () => {
  it("movie details render the Coming Soon state when providers fail", async () => {
    rememberSubject(UPCOMING);
    stubShareApi();
    stubFailures();
    renderRoute("/movie/spiderman-2", <MoviePage />);

    expect(await screen.findByRole("heading", { name: "Spider-Man 2" })).toBeInTheDocument();
    expect(screen.getByText("Coming Aug 28, 2026")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /share/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /watch/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/unavailable right now/i)).not.toBeInTheDocument();
  });

  it("series details render the Coming Soon state when providers fail", async () => {
    rememberSubject(UPCOMING_SERIES);
    stubFailures();
    renderRoute("/series/reacher-3", <SeriesDetailPage />);

    expect(await screen.findByRole("heading", { name: "Reacher 3" })).toBeInTheDocument();
    expect(screen.getByText("Coming Sep 1, 2026")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /watch/i })).not.toBeInTheDocument();
  });

  it("keeps the raw provider-failure error when nothing is known to be upcoming", async () => {
    stubFailures();
    renderRoute("/movie/unknown-title", <MoviePage />);

    expect(
      await screen.findByRole("heading", { name: /unavailable right now/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("shows no Preview when no preview URL exists", () => {
    render(
      <WatchlistProvider>
        <MemoryRouter>
          <ComingSoonDetails item={UPCOMING} />
        </MemoryRouter>
      </WatchlistProvider>,
    );
    expect(screen.getByRole("heading", { name: "Spider-Man 2" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Preview" })).not.toBeInTheDocument();
  });

  it("shows Preview only when a real preview URL exists", () => {
    render(
      <WatchlistProvider>
        <MemoryRouter>
          <ComingSoonDetails item={UPCOMING} previewUrl="https://cdn.example.com/trailer.mp4" />
        </MemoryRouter>
      </WatchlistProvider>,
    );
    expect(screen.getByRole("link", { name: "Preview" })).toHaveAttribute(
      "href",
      "https://cdn.example.com/trailer.mp4",
    );
  });

  it("renders the Coming Soon state when info succeeds without a release date", async () => {
    // The live info endpoint can omit the release date that home/search
    // already carried for this session; the cached date must be reused.
    rememberSubject(UPCOMING);
    stubFailures({
      "/info/": jsonResponse({
        subjectId: "spiderman-2",
        subjectType: 1,
        title: "Spider-Man 2",
        description: null,
        releaseDate: null,
        runtime: null,
        genre: null,
        poster: null,
        country: null,
        rating: null,
        hasResource: false,
        language: null,
        staff: [],
      }),
    });
    renderRoute("/movie/spiderman-2", <MoviePage />);

    expect(await screen.findByRole("heading", { name: "Spider-Man 2" })).toBeInTheDocument();
    expect(screen.getByText("Coming Aug 28, 2026")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /watch/i })).not.toBeInTheDocument();

    // Saving stores the cached release date, so My List keeps the status.
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    const stored = JSON.parse(localStorage.getItem(WATCHLIST_STORAGE_KEY) ?? "[]") as Array<{ subjectId: string; releaseDate: string | null }>;
    expect(stored).toContainEqual(expect.objectContaining({ subjectId: "spiderman-2", releaseDate: "2026-08-28" }));
  });
});

describe("Watch guard for Coming Soon", () => {
  it("blocks the player from cached metadata when the info fetch fails", async () => {
    rememberSubject(UPCOMING_SERIES);
    stubFailures();
    renderRoute("/watch/reacher-3", <WatchPage />);

    expect(await screen.findByRole("heading", { name: "Coming Soon" })).toBeInTheDocument();
    expect(screen.getByText("Available Sep 1, 2026")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to details" })).toHaveAttribute(
      "href",
      "/series/reacher-3",
    );
    // The player must never initialize for a known upcoming title.
    expect(screen.queryByLabelText("HD stream")).not.toBeInTheDocument();
  });

  it("blocks the player when info succeeds without a release date", async () => {
    rememberSubject(UPCOMING_SERIES);
    stubFailures({
      "/info/": jsonResponse({
        subjectId: "reacher-3",
        subjectType: 2,
        title: "Reacher 3",
        description: null,
        releaseDate: null,
        runtime: null,
        genre: null,
        poster: null,
        country: null,
        rating: null,
        hasResource: false,
        language: null,
        staff: [],
      }),
    });
    renderRoute("/watch/reacher-3", <WatchPage />);

    expect(await screen.findByRole("heading", { name: "Coming Soon" })).toBeInTheDocument();
    expect(screen.getByText("Available Sep 1, 2026")).toBeInTheDocument();
    expect(screen.queryByLabelText("HD stream")).not.toBeInTheDocument();
  });

  it("does not initialize the player when info confirms the title is unavailable", async () => {
    stubFailures({
      "/info/": jsonResponse({
        subjectId: "old",
        subjectType: 1,
        title: "Old Title",
        description: null,
        releaseDate: null,
        runtime: null,
        genre: null,
        poster: null,
        country: null,
        rating: null,
        hasResource: false,
        language: null,
        staff: [],
      }),
    });
    renderRoute("/watch/old", <WatchPage />);

    expect(
      await screen.findByRole("heading", { name: "Playback unavailable" }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("HD stream")).not.toBeInTheDocument();
  });
});

describe("My List with Coming Soon", () => {
  it("keeps a saved upcoming title with its status and Save state", async () => {
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify([UPCOMING]));
    render(
      <WatchlistProvider>
        <MemoryRouter>
          <MyListPage />
        </MemoryRouter>
      </WatchlistProvider>,
    );

    expect(screen.getByText("Spider-Man 2")).toBeInTheDocument();
    // The status badge and the meta line both carry the date label.
    expect(screen.getAllByText("Coming Aug 28").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Spider-Man 2" })).toHaveAttribute(
      "href",
      "/movie/spiderman-2",
    );
    expect(
      screen.queryByRole("link", { name: /watch/i }),
    ).not.toBeInTheDocument();
  });
});

describe("Search with Coming Soon", () => {
  it("keeps the Coming Soon status on search result cards", async () => {
    stubFailures({
      "/api/v1/media/home": jsonResponse({ rows: [], hero: [] }),
      "/api/v1/media/search?q=spider&page=1&perPage=20": jsonResponse({
        items: [
          {
            subjectId: "spiderman-2",
            subjectType: 1,
            type: "movie",
            title: "Spider-Man 2",
            releaseDate: "2026-08-28",
            duration: null,
            genre: null,
            poster: null,
            rating: null,
            language: null,
            country: null,
          },
        ],
        pager: { hasMore: false, totalCount: 1 },
      }),
    });
    renderRoute("/search?q=spider", <SearchPage />);

    expect(await screen.findByText("Spider-Man 2")).toBeInTheDocument();
    expect(screen.getAllByText("Coming Aug 28").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Spider-Man 2" })).toHaveAttribute(
      "href",
      "/movie/spiderman-2",
    );
    expect(screen.queryByRole("link", { name: /watch/i })).not.toBeInTheDocument();
  });
});

describe("Home Coming Soon rail", () => {
  it("hides the rail when nothing is upcoming and shows it when populated", async () => {
    const { unmount } = renderWithFeed({ rows: [] });
    expect(screen.queryByLabelText("Coming Soon")).not.toBeInTheDocument();
    unmount();

    renderWithFeed({
      rows: [
        {
          title: "Movies",
          opId: "op-1",
          type: "SUBJECTS_MOVIE",
          subjects: [UPCOMING],
        },
      ],
    });
    expect((await screen.findAllByLabelText("Coming Soon")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Coming Aug 28").length).toBeGreaterThan(0);
  });
});

function renderWithFeed(feed: { rows: unknown[] }) {
  stubFailures({
    "/api/v1/media/home": jsonResponse(feed),
  });
  return render(
    <WatchlistProvider>
      <MemoryRouter>
        <HomeFeed />
      </MemoryRouter>
    </WatchlistProvider>,
  );
}