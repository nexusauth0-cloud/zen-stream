import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { MediaBadge } from "./MediaBadge";
import { MediaCard, detailsRouteFor } from "./MediaCard";
import { MediaMetadata, releaseYear } from "./MediaMetadata";
import { RatingBadge } from "./RatingBadge";
import { WatchlistButton } from "./WatchlistButton";
import { WatchlistProvider } from "../../store/watchlist";
import type { MediaSubjectSummary } from "@zen-stream/contracts";

function subject(overrides: Partial<MediaSubjectSummary> = {}): MediaSubjectSummary {
  return {
    subjectId: "123",
    type: "movie",
    title: "Harbor Lights",
    poster: null,
    hasResource: true,
    description: null,
    releaseDate: "2023-05-01",
    runtime: 108,
    genre: "Crime",
    rating: 7.4,
    language: "English",
    country: null,
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe("detailsRouteFor", () => {
  it("routes movies and series to their detail pages", () => {
    expect(detailsRouteFor({ subjectId: "1", type: "movie" })).toBe("/movie/1");
    expect(detailsRouteFor({ subjectId: "2", type: "series" })).toBe("/series/2");
    expect(detailsRouteFor({ subjectId: "3", type: "shorts" })).toBe("/series/3");
  });
});

describe("MediaBadge", () => {
  it("labels each media type", () => {
    const { rerender } = render(<MediaBadge type="movie" />);
    expect(screen.getByText("Movie")).toBeInTheDocument();
    rerender(<MediaBadge type="series" />);
    expect(screen.getByText("Series")).toBeInTheDocument();
    rerender(<MediaBadge type="shorts" />);
    expect(screen.getByText("Shorts")).toBeInTheDocument();
  });
});

describe("RatingBadge", () => {
  it("renders a formatted rating", () => {
    render(<RatingBadge rating={7.4} />);
    expect(screen.getByText("7.4")).toBeInTheDocument();
  });

  it("renders nothing without a rating", () => {
    const { container } = render(<RatingBadge rating={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("MediaMetadata", () => {
  it("joins available fragments", () => {
    render(<MediaMetadata year="2023" runtime={108} genre="Crime" language="English" />);
    expect(screen.getByText("2023 · 1h 48m · Crime · English")).toBeInTheDocument();
  });

  it("renders nothing when all fragments are missing", () => {
    const { container } = render(<MediaMetadata />);
    expect(container).toBeEmptyDOMElement();
  });

  it("extracts the year from ISO dates", () => {
    expect(releaseYear("2009-12-18")).toBe("2009");
    expect(releaseYear(null)).toBeNull();
  });
});

describe("MediaCard", () => {
  it("links to the details page and shows a fallback without a poster", () => {
    render(
      <MemoryRouter>
        <WatchlistProvider>
          <MediaCard item={subject()} />
        </WatchlistProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Harbor Lights" })).toHaveAttribute("href", "/movie/123");
    expect(screen.getByText("7.4 · 2023")).toBeInTheDocument();
  });

  it("uses the real poster when present", () => {
    const { container } = render(
      <MemoryRouter>
        <WatchlistProvider>
          <MediaCard item={subject({ poster: "https://cdn.example/p.jpg" })} />
        </WatchlistProvider>
      </MemoryRouter>,
    );

    expect(container.querySelector("img")).toHaveAttribute("src", "https://cdn.example/p.jpg");
  });

  it("toggles the watchlist from the card", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <WatchlistProvider>
          <MediaCard item={subject()} />
        </WatchlistProvider>
      </MemoryRouter>,
    );

    const save = screen.getByRole("button", { name: "Add Harbor Lights to My List" });
    await user.click(save);
    expect(screen.getByRole("button", { name: "Remove Harbor Lights from My List" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});

describe("WatchlistButton", () => {
  it("shares state with the card-level toggle", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <WatchlistProvider>
          <MediaCard item={subject()} />
          <WatchlistButton item={subject()} />
        </WatchlistProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Add Harbor Lights to My List" }));
    expect(screen.getByRole("button", { name: "In My List" })).toHaveAttribute("aria-pressed", "true");
  });
});