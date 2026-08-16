import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmptyState, ErrorState } from "./States";
import { SkeletonGrid, SkeletonRail } from "./LoadingSkeleton";
import { WatchlistProvider, useWatchlist, WATCHLIST_STORAGE_KEY } from "../../store/watchlist";
import type { MediaSubjectSummary } from "@zen-stream/contracts";

function subject(overrides: Partial<MediaSubjectSummary> = {}): MediaSubjectSummary {
  return {
    subjectId: "123",
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
    ...overrides,
  };
}

describe("EmptyState", () => {
  it("renders a title and optional message", () => {
    render(<EmptyState title="Nothing here" message="Check back soon." />);
    expect(screen.getByRole("heading", { name: "Nothing here" })).toBeInTheDocument();
    expect(screen.getByText("Check back soon.")).toBeInTheDocument();
  });
});

describe("ErrorState", () => {
  it("invokes retry", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState message="Down." onRetry={onRetry} />);

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

describe("LoadingSkeleton", () => {
  it("exposes an accessible status", () => {
    render(<SkeletonRail count={4} label="Loading featured" />);
    expect(screen.getByRole("status", { name: "Loading featured" })).toBeInTheDocument();
    render(<SkeletonGrid count={4} label="Loading grid" />);
    expect(screen.getByRole("status", { name: "Loading grid" })).toBeInTheDocument();
  });
});

describe("watchlist store", () => {
  it("persists toggles to localStorage", async () => {
    const user = userEvent.setup();
    render(
      <WatchlistProvider>
        <WatchlistProbe />
      </WatchlistProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Toggle" }));

    expect(screen.getByText("saved: true")).toBeInTheDocument();
    const stored = JSON.parse(localStorage.getItem(WATCHLIST_STORAGE_KEY) ?? "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0].subjectId).toBe("123");
  });

  it("restores persisted entries on mount", () => {
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify([subject()]));

    render(
      <WatchlistProvider>
        <WatchlistProbe />
      </WatchlistProvider>,
    );

    expect(screen.getByText("count: 1")).toBeInTheDocument();
  });
});

function WatchlistProbe() {
  const { items, isSaved, toggle } = useWatchlist();
  return (
    <div>
      <span>count: {items.length}</span>
      <span>saved: {String(isSaved("123"))}</span>
      <button type="button" onClick={() => toggle(subject())}>
        Toggle
      </button>
    </div>
  );
}