import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "./App";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe("routing", () => {
  const cases = [
    { path: "/movies", title: "Movies", route: "/movies" },
    { path: "/series", title: "Series", route: "/series" },
    { path: "/search", title: "Search", route: "/search" },
    { path: "/my-list", title: "My List", route: "/my-list" },
    { path: "/history", title: "History", route: "/history" },
    { path: "/account", title: "Account", route: "/account" },
    { path: "/watch/123", title: "Watch", route: "/watch/:subjectId" },
  ] as const;

  it.each(cases)("renders the $title placeholder at $path", ({ path, title, route }) => {
    renderAt(path);

    expect(screen.getByRole("heading", { level: 1, name: title })).toBeInTheDocument();
    expect(screen.getByTestId("placeholder-page")).toBeInTheDocument();
    expect(screen.getByTestId("placeholder-route")).toHaveTextContent(route);
  });

  it("renders the cinematic landing page at /", () => {
    renderAt("/");

    expect(screen.getByRole("heading", { level: 1, name: /the long afterlight/i })).toBeInTheDocument();
    expect(screen.queryByTestId("placeholder-page")).not.toBeInTheDocument();
  });

  it("renders the not-found page for unknown routes", () => {
    renderAt("/does-not-exist");

    expect(screen.getByRole("heading", { level: 1, name: "Page not found" })).toBeInTheDocument();
    expect(screen.getByText(/this page does not exist/i)).toBeInTheDocument();
  });

  it("keeps a correct heading hierarchy with a single h1", () => {
    renderAt("/");

    const headings = screen.getAllByRole("heading");
    expect(headings.filter((h) => h.tagName === "H1")).toHaveLength(1);
    // No heading level is skipped: h1 followed by h2 sections.
    expect(headings.every((h) => ["H1", "H2"].includes(h.tagName))).toBe(true);
  });

  it("hides decorative navigation icons from assistive technology", () => {
    renderAt("/");

    const main = screen.getByRole("main");
    expect(within(main).queryByRole("img")).not.toBeInTheDocument();
    // No icon is a meaningful role anywhere in the shell.
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});

describe("active navigation", () => {
  it("marks the active route with aria-current on the sidebar item", () => {
    renderAt("/movies");

    const sidebar = screen.getByRole("navigation", { name: "Primary navigation" });
    const movies = within(sidebar).getByRole("link", { name: "Movies" });
    expect(movies).toHaveAttribute("aria-current", "page");

    const home = within(sidebar).getByRole("link", { name: "Home" });
    expect(home).not.toHaveAttribute("aria-current");
  });

  it("marks the active route on the mobile bottom navigation", () => {
    renderAt("/my-list");

    const mobileNav = screen.getByRole("navigation", { name: "Mobile navigation" });
    const active = within(mobileNav).getByRole("link", { name: /My List/i });
    expect(active).toHaveAttribute("aria-current", "page");
  });
});