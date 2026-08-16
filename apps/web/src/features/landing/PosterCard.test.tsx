import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PosterCard } from "./PosterCard";
import type { FixtureTitle } from "./fixtures";

const movie: FixtureTitle = { id: "signal-zero", title: "Signal Zero", year: 2024, genre: "Thriller", progress: 0.62 };

describe("PosterCard", () => {
  it("shows title, year, and genre metadata", () => {
    render(
      <MemoryRouter>
        <PosterCard title={movie} to="/movies" />
      </MemoryRouter>,
    );

    expect(screen.getByText("Signal Zero")).toBeInTheDocument();
    expect(screen.getByText("2024 · Thriller")).toBeInTheDocument();
  });

  it("is named accessibly by its title when interactive", () => {
    render(
      <MemoryRouter>
        <PosterCard title={movie} to="/movies" />
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", { name: /signal zero/i });
    expect(link).toHaveAttribute("href", "/movies");
  });

  it("exposes demo progress as a progressbar when present", () => {
    render(
      <MemoryRouter>
        <PosterCard title={movie} to="/movies" />
      </MemoryRouter>,
    );

    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "62");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("renders no progressbar without progress data", () => {
    render(
      <MemoryRouter>
        <PosterCard title={{ ...movie, progress: undefined }} to="/movies" />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("renders as a non-interactive card when no destination is given", () => {
    render(
      <MemoryRouter>
        <PosterCard title={movie} />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByTestId("poster-card").tagName).toBe("ARTICLE");
  });

  it("never shows fake statistics", () => {
    render(
      <MemoryRouter>
        <PosterCard title={movie} to="/movies" />
      </MemoryRouter>,
    );

    expect(screen.queryByText(/views|watched by|rating|popular|million/i)).not.toBeInTheDocument();
  });
});