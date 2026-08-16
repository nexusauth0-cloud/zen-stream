import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "../../App";
import { HOME_COPY, HOME_FEED, HOME_FEED_SECTIONS } from "./fixtures";

function renderLanding() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe("streaming homepage", () => {
  it("is served at the home route only", () => {
    const { unmount } = renderLanding();
    expect(screen.getByRole("heading", { level: 1, name: HOME_FEED.hero.title })).toBeInTheDocument();
    unmount();

    render(
      <MemoryRouter initialEntries={["/movies"]}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.queryByRole("heading", { level: 1, name: HOME_FEED.hero.title })).not.toBeInTheDocument();
  });

  it("exposes exactly one h1", () => {
    renderLanding();

    const headings = screen.getAllByRole("heading");
    expect(headings.filter((h) => h.tagName === "H1")).toHaveLength(1);
    expect(headings.every((h) => ["H1", "H2"].includes(h.tagName))).toBe(true);
  });

  it("renders the cinematic hero with the featured title", () => {
    renderLanding();

    const hero = screen.getByRole("heading", { level: 1, name: HOME_FEED.hero.title }).closest("section")!;
    expect(within(hero).getByText(HOME_FEED.hero.synopsis!)).toBeInTheDocument();
    expect(within(hero).getByText(/2025 · Science Fiction · 2h 8m/i)).toBeInTheDocument();

    const watch = within(hero).getByRole("link", { name: HOME_COPY.watch });
    expect(watch).toHaveAttribute("href", "/movies");

    const moreInfo = within(hero).getByRole("link", { name: HOME_COPY.moreInfo });
    expect(moreInfo).toHaveAttribute("href", "/movies");
  });

  it("renders every feed section as a heading-2 rail", () => {
    renderLanding();

    for (const section of HOME_FEED_SECTIONS) {
      expect(screen.getByRole("heading", { level: 2, name: section.title })).toBeInTheDocument();
    }
  });

  it("sends rail cards and see-all links to the right routes", () => {
    renderLanding();

    const popularMovies = screen.getByRole("heading", { level: 2, name: "Popular Movies" }).closest("section")!;
    expect(within(popularMovies).getByRole("link", { name: /see all/i })).toHaveAttribute("href", "/movies");
    expect(within(popularMovies).getAllByTestId("poster-card")[0]).toHaveAttribute("href", "/movies");

    const popularSeries = screen.getByRole("heading", { level: 2, name: "Popular Series" }).closest("section")!;
    expect(within(popularSeries).getByRole("link", { name: /see all/i })).toHaveAttribute("href", "/series");
    expect(within(popularSeries).getAllByTestId("poster-card")[0]).toHaveAttribute("href", "/series");

    const comedy = screen.getByRole("heading", { level: 2, name: "Comedy" }).closest("section")!;
    expect(within(comedy).getAllByTestId("poster-card")[0]).toHaveAttribute("href", "/movies");
  });

  it("hides the see-all action on the continue-watching rail", () => {
    renderLanding();

    const continueRail = screen.getByRole("heading", { level: 2, name: "Continue watching" }).closest("section")!;
    expect(within(continueRail).queryByRole("link", { name: /see all/i })).not.toBeInTheDocument();
  });

  it("renders continue-watching as a demo with progress bars", () => {
    renderLanding();

    const continueRail = screen.getByRole("heading", { level: 2, name: "Continue watching" }).closest("section")!;
    expect(within(continueRail).getByText(/demo preview/i)).toBeInTheDocument();

    const progressBars = within(continueRail).getAllByRole("progressbar");
    expect(progressBars.length).toBeGreaterThan(0);
    for (const bar of progressBars) {
      expect(bar).toHaveAttribute("aria-valuemin", "0");
      expect(bar).toHaveAttribute("aria-valuemax", "100");
      expect(bar).toHaveAttribute("aria-valuenow");
    }
  });

  it("places the product preview below the feed sections", () => {
    renderLanding();

    const preview = screen.getByTestId("product-preview-desktop");
    const lastRail = screen.getByRole("heading", { level: 2, name: "Weekend Discoveries" });

    expect(preview.compareDocumentPosition(lastRail) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  });

  it("renders the compact footer with brand, navigation, and legal placeholder", () => {
    renderLanding();

    expect(screen.getByText(HOME_COPY.footerStatement)).toBeInTheDocument();
    expect(screen.getByText(HOME_COPY.footerLegal)).toBeInTheDocument();

    const footerNav = screen.getByRole("navigation", { name: "Footer" });
    const targets = within(footerNav)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    expect(targets).toEqual(["/movies", "/series", "/search", "/my-list", "/account"]);
  });

  it("keeps the product preview as a secondary surface", () => {
    renderLanding();

    expect(screen.getByRole("heading", { level: 2, name: HOME_COPY.previewTitle })).toBeInTheDocument();
    expect(screen.queryByText(/story is already waiting/i)).not.toBeInTheDocument();
  });
});