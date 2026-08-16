import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "../../App";
import { CATEGORIES, CONTINUE_WATCHING_TITLES, FEATURED_TITLE, LANDING_COPY, MOVIE_TITLES, SERIES_TITLES } from "./fixtures";

function renderLanding() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe("landing page", () => {
  it("is served at the home route only", () => {
    const { unmount } = renderLanding();
    expect(screen.getByRole("heading", { level: 1, name: /story is already waiting/i })).toBeInTheDocument();
    unmount();

    render(
      <MemoryRouter initialEntries={["/movies"]}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.queryByRole("heading", { level: 1, name: /story is already waiting/i })).not.toBeInTheDocument();
  });

  it("exposes exactly one h1", () => {
    renderLanding();

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("renders the hero with primary and secondary CTAs", () => {
    renderLanding();

    expect(screen.getByText(LANDING_COPY.heroSupport)).toBeInTheDocument();

    const hero = screen.getByRole("heading", { level: 1 }).closest("section")!;
    const primary = within(hero).getByRole("link", { name: LANDING_COPY.primaryCta });
    expect(primary).toHaveAttribute("href", "/movies");

    const secondary = within(hero).getByRole("link", { name: LANDING_COPY.secondaryCta });
    expect(secondary).toHaveAttribute("href", "/series");
  });

  it("renders the featured section with metadata and a CTA", () => {
    renderLanding();

    const title = screen.getByRole("heading", { level: 2, name: FEATURED_TITLE.title });
    expect(title).toBeInTheDocument();

    const featuredSection = title.closest("section")!;
    expect(within(featuredSection).getByText(LANDING_COPY.featuredEyebrow)).toBeInTheDocument();

    const meta = within(featuredSection).getByText(
      `${FEATURED_TITLE.genre} · ${FEATURED_TITLE.year} · ${FEATURED_TITLE.runtimeMinutes} min`,
    );
    expect(meta).toBeInTheDocument();
    expect(within(featuredSection).getByText(FEATURED_TITLE.synopsis!)).toBeInTheDocument();
    expect(within(featuredSection).getByRole("link", { name: /^explore$/i })).toHaveAttribute("href", "/movies");
  });

  it("renders the continue-watching concept with demo progress", () => {
    renderLanding();

    expect(screen.getByRole("heading", { level: 2, name: LANDING_COPY.continueEyebrow })).toBeInTheDocument();
    expect(screen.getByText(LANDING_COPY.continueNote)).toBeInTheDocument();

    const progressBars = screen.getAllByRole("progressbar");
    expect(progressBars).toHaveLength(CONTINUE_WATCHING_TITLES.length);
    for (const bar of progressBars) {
      expect(bar).toHaveAttribute("aria-valuemin", "0");
      expect(bar).toHaveAttribute("aria-valuemax", "100");
      expect(bar).toHaveAttribute("aria-valuenow");
    }
  });

  it("renders all browse categories as navigation surfaces", () => {
    renderLanding();

    expect(screen.getByRole("heading", { level: 2, name: LANDING_COPY.categoriesTitle })).toBeInTheDocument();
    for (const category of CATEGORIES) {
      const link = screen.getByRole("link", { name: category.label });
      expect(link).toHaveAttribute("href", "/movies");
    }
  });

  it("renders the movies and series discovery sections with see-all links", () => {
    renderLanding();

    const movies = screen.getByRole("heading", { level: 2, name: LANDING_COPY.moviesTitle });
    expect(movies).toBeInTheDocument();
    const moviesSection = movies.closest("section")!;
    expect(within(moviesSection).getByRole("link", { name: /see all/i })).toHaveAttribute("href", "/movies");
    expect(within(moviesSection).getAllByTestId("poster-card").length).toBe(MOVIE_TITLES.length);

    const series = screen.getByRole("heading", { level: 2, name: LANDING_COPY.seriesTitle });
    expect(series).toBeInTheDocument();
    const seriesSection = series.closest("section")!;
    expect(within(seriesSection).getByRole("link", { name: /see all/i })).toHaveAttribute("href", "/series");
    expect(within(seriesSection).getAllByTestId("poster-card").length).toBe(SERIES_TITLES.length);

    const posterCards = screen.getAllByTestId("poster-card");
    // Discovery rails (18) + ProductPreview fixtures (4 desktop + 3 mobile).
    expect(posterCards.length).toBe(MOVIE_TITLES.length + SERIES_TITLES.length + CONTINUE_WATCHING_TITLES.length + 7);
  });

  it("renders the product preview frames", () => {
    renderLanding();

    expect(screen.getByTestId("product-preview-desktop")).toBeInTheDocument();
    expect(screen.getByTestId("product-preview-mobile")).toBeInTheDocument();
  });

  it("renders the final CTA with both destinations", () => {
    renderLanding();

    const finalTitle = screen.getByRole("heading", { level: 2, name: LANDING_COPY.finalTitle });
    expect(finalTitle).toBeInTheDocument();

    const finalSection = finalTitle.closest("section")!;
    const links = within(finalSection).getAllByRole("link");
    expect(links.map((l) => [l.textContent?.trim(), l.getAttribute("href")])).toEqual([
      [LANDING_COPY.primaryCta, "/movies"],
      [LANDING_COPY.secondaryCta, "/series"],
    ]);
  });

  it("renders the footer with brand and navigation", () => {
    renderLanding();

    expect(screen.getByText(LANDING_COPY.footerStatement)).toBeInTheDocument();
    expect(screen.getByText(LANDING_COPY.footerLegal)).toBeInTheDocument();

    const footerNav = screen.getByRole("navigation", { name: "Footer" });
    const targets = within(footerNav)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    expect(targets).toEqual(["/movies", "/series", "/search", "/account"]);
  });
});