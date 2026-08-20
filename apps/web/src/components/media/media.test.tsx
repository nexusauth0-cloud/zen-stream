import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { MediaInfo, MediaSubjectSummary } from "@zen-stream/contracts";
import { MediaBadge } from "./MediaBadge";
import { DetailsHero } from "./DetailsHero";
import { Hero } from "./Hero";
import { MediaCard, detailsRouteFor } from "./MediaCard";
import { MediaMetadata, releaseYear } from "./MediaMetadata";
import { RatingBadge } from "./RatingBadge";
import { WatchlistButton } from "./WatchlistButton";
import { WatchlistProvider } from "../../store/watchlist";

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

function renderHero(item: MediaSubjectSummary, previewUrl?: string | null) {
  return render(
    <MemoryRouter>
      <WatchlistProvider>
        <Hero item={item} titleId="hero-title" previewUrl={previewUrl} />
      </WatchlistProvider>
    </MemoryRouter>,
  );
}

describe("Hero availability actions", () => {
  it("offers Watch, My List, and Share for an available title", () => {
    renderHero(subject());
    expect(screen.getByRole("link", { name: /watch/i })).toHaveAttribute("href", "/watch/123");
    expect(screen.getByRole("button", { name: "My List" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share Harbor Lights" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument();
  });

  it("swaps Watch for Save on an upcoming title — never playback", () => {
    renderHero(subject({ releaseDate: "2026-08-28" }));
    expect(screen.queryByRole("link", { name: /watch/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share Harbor Lights" })).toBeInTheDocument();
  });

  it("shows Preview for an upcoming title with a preview, still no Watch", () => {
    renderHero(subject({ releaseDate: "2026-08-28" }), "https://cdn.example/preview.mp4");
    expect(screen.getByRole("link", { name: /preview/i })).toHaveAttribute(
      "href",
      "https://cdn.example/preview.mp4",
    );
    expect(screen.queryByRole("link", { name: /watch/i })).not.toBeInTheDocument();
  });

  it("offers Save and Share only when nothing can be played", () => {
    renderHero(subject({ hasResource: false, releaseDate: null }));
    expect(screen.queryByRole("link", { name: /watch/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share Harbor Lights" })).toBeInTheDocument();
  });
});

describe("MediaCard availability", () => {
  it("marks upcoming titles with a date badge and Coming meta", () => {
    render(
      <MemoryRouter>
        <WatchlistProvider>
          <MediaCard item={subject({ releaseDate: "2026-08-28" })} />
        </WatchlistProvider>
      </MemoryRouter>,
    );
    expect(screen.getByText("Coming Aug 28")).toBeInTheDocument();
    expect(screen.getByText(/7\.4 · Coming Aug 28/)).toBeInTheDocument();
  });

  it("shows no status badge for available titles", () => {
    render(
      <MemoryRouter>
        <WatchlistProvider>
          <MediaCard item={subject()} />
        </WatchlistProvider>
      </MemoryRouter>,
    );
    expect(screen.queryByText(/Coming/)).not.toBeInTheDocument();
  });
});

describe("DetailsHero availability actions", () => {
  function info(overrides: Partial<MediaInfo> = {}): MediaInfo {
    return {
      subjectId: "123",
      type: "movie",
      title: "Harbor Lights",
      description: null,
      releaseDate: "2023-05-01",
      runtime: 108,
      genre: "Crime",
      poster: null,
      backdrop: null,
      country: null,
      rating: 7.4,
      hasResource: true,
      language: "English",
      staff: [],
      externalIds: { moviebox: null, spun: null, daratech: null, imdb: null, tmdb: null },
      ...overrides,
    };
  }

  function renderDetails(media: MediaInfo) {
    return render(
      <MemoryRouter>
        <WatchlistProvider>
          <DetailsHero info={media} />
        </WatchlistProvider>
      </MemoryRouter>,
    );
  }

  it("shows Watch, My List, and Share for an available title", () => {
    renderDetails(info());
    expect(screen.getByRole("link", { name: /watch now/i })).toHaveAttribute("href", "/watch/123");
    expect(screen.getByRole("button", { name: "My List" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share Harbor Lights" })).toBeInTheDocument();
  });

  it("shows Save, Share, and the release date for an upcoming title", () => {
    renderDetails(info({ releaseDate: "2026-09-01", hasResource: true }));
    expect(screen.queryByRole("link", { name: /watch/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByText("Coming Sep 1, 2026")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share Harbor Lights" })).toBeInTheDocument();
  });

  it("shows the honest unavailable state with Save and Share", () => {
    renderDetails(info({ hasResource: false, releaseDate: null }));
    expect(screen.queryByRole("link", { name: /watch/i })).not.toBeInTheDocument();
    expect(screen.getByText("Not available to stream yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share Harbor Lights" })).toBeInTheDocument();
  });
});
