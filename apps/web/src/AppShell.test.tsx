import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "./App";
import { WatchlistProvider } from "./store/watchlist";

function renderShell() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <WatchlistProvider>
        <AppRoutes />
      </WatchlistProvider>
    </MemoryRouter>,
  );
}

describe("AppShell", () => {
  it("exposes a skip link to the main content", () => {
    renderShell();

    const skip = screen.getByRole("link", { name: "Skip to content" });
    expect(skip).toHaveAttribute("href", "#zs-main");
  });

  it("provides a main landmark with a stable id", () => {
    renderShell();

    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "zs-main");
  });

  it("provides a streaming header with brand and navigation", () => {
    renderShell();

    expect(screen.getByRole("banner")).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Primary navigation" });
    const targets = within(nav)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    expect(targets).toEqual(["/", "/movies", "/series", "/my-list"]);
  });

  it("renders the brand as a link home", () => {
    renderShell();

    const brand = screen.getByRole("link", { name: "Zen-Stream home" });
    expect(brand).toHaveAttribute("href", "/");
  });

  it("exposes a desktop search field that submits to the search route", async () => {
    const user = userEvent.setup();
    renderShell();

    const searchbox = screen.getByRole("searchbox", { name: "Search movies and TV shows" });
    await user.type(searchbox, "avatar");
    await user.click(screen.getByRole("button", { name: "Search movies and TV shows" }));

    expect(await screen.findByRole("heading", { name: "Search" })).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Search movies and TV shows" })).toHaveValue(
      "avatar",
    );
  });

  it("provides mobile navigation with the primary destinations", () => {
    renderShell();

    const mobileNav = screen.getByRole("navigation", { name: "Mobile navigation" });
    const targets = within(mobileNav)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    expect(targets).toEqual(["/", "/movies", "/series", "/search", "/my-list"]);
  });

  it("renders a footer with real destinations only", () => {
    renderShell();

    const footer = screen.getByRole("contentinfo");
    const footerNav = within(footer).getByRole("navigation", { name: "Footer" });
    const targets = within(footerNav)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    expect(targets).toEqual(["/", "/movies", "/series", "/search", "/my-list"]);
  });
});

describe("active navigation", () => {
  it("marks the active route on the header nav", () => {
    render(
      <MemoryRouter initialEntries={["/movies"]}>
        <WatchlistProvider>
          <AppRoutes />
        </WatchlistProvider>
      </MemoryRouter>,
    );

    const headerNav = screen.getByRole("navigation", { name: "Primary navigation" });
    const movies = within(headerNav).getByRole("link", { name: "Movies" });
    expect(movies).toHaveAttribute("aria-current", "page");

    const home = within(headerNav).getByRole("link", { name: "Home" });
    expect(home).not.toHaveAttribute("aria-current");
  });

  it("marks the active route on the mobile bottom navigation", () => {
    render(
      <MemoryRouter initialEntries={["/my-list"]}>
        <WatchlistProvider>
          <AppRoutes />
        </WatchlistProvider>
      </MemoryRouter>,
    );

    const mobileNav = screen.getByRole("navigation", { name: "Mobile navigation" });
    const active = within(mobileNav).getByRole("link", { name: /My List/i });
    expect(active).toHaveAttribute("aria-current", "page");
  });
});