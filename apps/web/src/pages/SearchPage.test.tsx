import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { MediaHomeFeed, MediaSearchResponse } from "@zen-stream/contracts";
import { WatchlistProvider } from "../store/watchlist";
import { SearchPage } from "./SearchPage";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const EMPTY_FEED: MediaHomeFeed = { total: 0, rows: [] };

const SEARCH_RESULTS: MediaSearchResponse = {
  items: [
    {
      subjectId: "movie:27205",
      type: "movie",
      title: "Inception",
      releaseDate: "2010-07-15",
      poster: null,
      genre: "Sci-Fi",
      rating: 8.4,
      language: "en",
      country: null,
      duration: null,
    },
  ],
  pager: { page: 1, perPage: 20, hasMore: false, totalCount: 1 },
};

function stubFetch(search: () => Response | Promise<Response>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/v1/media/home")) return jsonResponse(EMPTY_FEED);
      if (url.includes("/api/v1/media/search")) return search();
      return jsonResponse({ error: { code: "HTTP_ERROR", message: "unexpected request" } }, 500);
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderSearch() {
  return render(
    <MemoryRouter initialEntries={["/search"]}>
      <WatchlistProvider>
        <SearchPage />
      </WatchlistProvider>
    </MemoryRouter>,
  );
}

function typeQuery(value: string) {
  fireEvent.change(screen.getByRole("searchbox", { name: "Search the catalog" }), {
    target: { value },
  });
}

describe("SearchPage", () => {
  it("renders results for a successful search", async () => {
    stubFetch(() => jsonResponse(SEARCH_RESULTS));
    renderSearch();
    typeQuery("inception");

    await waitFor(() => {
      expect(screen.getByText("Results for “inception”")).toBeInTheDocument();
    });
    expect(screen.getByText("Inception")).toBeInTheDocument();
    expect(screen.getByText("1 result")).toBeInTheDocument();
  });

  it("distinguishes a genuine empty result from a failure", async () => {
    stubFetch(() =>
      jsonResponse({ items: [], pager: { page: 1, perPage: 20, hasMore: false, totalCount: 0 } }),
    );
    renderSearch();
    typeQuery("zzzz");

    await waitFor(() => {
      expect(screen.getByText("No results for “zzzz”")).toBeInTheDocument();
    });
    expect(screen.queryByText("Search is unavailable right now")).not.toBeInTheDocument();
  });

  it("surfaces an upstream search failure as an error state with retry", async () => {
    stubFetch(() =>
      jsonResponse(
        { error: { code: "MEDIA_UPSTREAM_ERROR", message: "Upstream media search is temporarily unavailable" } },
        502,
      ),
    );
    renderSearch();
    typeQuery("inception");

    await waitFor(() => {
      expect(screen.getByText("Search is unavailable right now")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.queryByText(/No results for/)).not.toBeInTheDocument();
  });
});