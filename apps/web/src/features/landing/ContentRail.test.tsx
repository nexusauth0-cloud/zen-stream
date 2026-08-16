import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ContentRail } from "./ContentRail";
import type { FeedSection } from "./fixtures";

const section: FeedSection = {
  id: "sci-fi",
  title: "Science Fiction",
  kind: "genre-rail",
  genre: "science-fiction",
  subtitle: "Longer horizons.",
  items: [
    { id: "meridian", title: "Meridian", year: 2021, genre: "Science Fiction", kind: "movie", artMood: "violet" },
    { id: "vast", title: "Vast", year: 2024, genre: "Science Fiction", kind: "movie", artMood: "violet" },
    { id: "second-moon", title: "Second Moon", year: 2025, genre: "Science Fiction", kind: "series", artMood: "violet" },
  ],
};

function renderRail(props: Partial<React.ComponentProps<typeof ContentRail>> = {}) {
  return render(
    <MemoryRouter>
      <ContentRail section={section} {...props} />
    </MemoryRouter>,
  );
}

describe("ContentRail", () => {
  it("renders the section title as a heading with the subtitle", () => {
    renderRail();

    expect(screen.getByRole("heading", { level: 2, name: "Science Fiction" })).toBeInTheDocument();
    expect(screen.getByText("Longer horizons.")).toBeInTheDocument();
  });

  it("labels the scroller group with the section title", () => {
    renderRail();

    expect(screen.getByRole("group", { name: "Science Fiction" })).toBeInTheDocument();
  });

  it("renders one card per item, linked to cardTo", () => {
    renderRail({ cardTo: "/movies", seeAllTo: "/movies" });

    const cards = screen.getAllByTestId("poster-card");
    expect(cards).toHaveLength(3);
    for (const card of cards) {
      expect(card).toHaveAttribute("href", "/movies");
    }
    expect(screen.getByRole("link", { name: /meridian/i })).toBeInTheDocument();
  });

  it("shows the see-all action only when seeAllTo is given", () => {
    const { unmount } = renderRail({ seeAllTo: "/movies" });
    expect(screen.getByRole("link", { name: /see all/i })).toHaveAttribute("href", "/movies");
    unmount();

    renderRail();
    expect(screen.queryByRole("link", { name: /see all/i })).not.toBeInTheDocument();
  });

  it("provides accessible scroll controls", () => {
    renderRail();

    expect(screen.getByRole("button", { name: "Scroll Science Fiction backward" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Scroll Science Fiction forward" })).toBeDisabled();
  });

  it("renders an empty state without cards or scroller", () => {
    renderRail({ section: { ...section, items: [] } });

    expect(screen.getByText(/nothing here yet/i)).toBeInTheDocument();
    expect(screen.queryByTestId("poster-card")).not.toBeInTheDocument();
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });

  it("renders cards as non-interactive when no destination is given", () => {
    renderRail();

    const card = screen.getAllByTestId("poster-card")[0]!;
    expect(card.tagName).toBe("ARTICLE");
  });

  it("does not expose scroll controls to the accessibility tree of the scroller", () => {
    const { container } = renderRail();

    const group = container.querySelector('[role="group"]')!;
    expect(within(group as HTMLElement).queryByRole("button")).not.toBeInTheDocument();
  });
});