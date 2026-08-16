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
    { path: "/", title: "Home" },
    { path: "/movies", title: "Movies" },
    { path: "/series", title: "Series" },
    { path: "/search", title: "Search" },
    { path: "/my-list", title: "My List" },
    { path: "/history", title: "History" },
    { path: "/account", title: "Account" },
    { path: "/player", title: "Player" },
  ] as const;

  it.each(cases)("renders the $title placeholder at $path", ({ path, title }) => {
    renderAt(path);

    expect(screen.getByRole("heading", { level: 1, name: title })).toBeInTheDocument();
    expect(screen.getByTestId("placeholder-page")).toBeInTheDocument();
    expect(screen.getByTestId("placeholder-route")).toHaveTextContent(path);
  });

  it("renders the not-found page for unknown routes", () => {
    renderAt("/does-not-exist");

    expect(screen.getByRole("heading", { level: 1, name: "Page not found" })).toBeInTheDocument();
    expect(screen.getByText(/this page does not exist/i)).toBeInTheDocument();
  });

  it("keeps a correct heading hierarchy with a single h1", () => {
    renderAt("/");

    const headings = screen.getAllByRole("heading");
    expect(headings).toHaveLength(1);
    expect(headings[0]?.tagName).toBe("H1");
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