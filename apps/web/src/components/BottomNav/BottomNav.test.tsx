import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "../../App";
import { WatchlistProvider } from "../../store/watchlist";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <WatchlistProvider>
        <AppRoutes />
      </WatchlistProvider>
    </MemoryRouter>,
  );
}

describe("BottomNav (mobile)", () => {
  it("provides the five primary mobile destinations", () => {
    renderAt("/");

    const nav = screen.getByRole("navigation", { name: "Mobile navigation" });
    const labels = within(nav)
      .getAllByRole("link")
      .map((link) => link.getAttribute("aria-label") ?? link.textContent?.trim());

    expect(labels).toEqual(["Home", "Movies", "Series", "Search", "My List"]);
  });

  it("marks the active destination with aria-current", () => {
    renderAt("/my-list");

    const nav = screen.getByRole("navigation", { name: "Mobile navigation" });
    const myList = within(nav).getByRole("link", { name: /My List/i });
    expect(myList).toHaveAttribute("aria-current", "page");
  });

  it("does not mark inactive destinations", () => {
    renderAt("/");

    const nav = screen.getByRole("navigation", { name: "Mobile navigation" });
    const movies = within(nav).getByRole("link", { name: /Movies/i });
    expect(movies).not.toHaveAttribute("aria-current");
  });

  it("labels every icon with visible text (no icon-only controls)", () => {
    renderAt("/");

    const nav = screen.getByRole("navigation", { name: "Mobile navigation" });
    for (const link of within(nav).getAllByRole("link")) {
      const text = link.textContent?.trim() ?? "";
      expect(text.length).toBeGreaterThan(0);
    }
  });
});