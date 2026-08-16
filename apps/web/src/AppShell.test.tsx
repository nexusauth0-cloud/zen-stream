import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "./App";
import { SIDEBAR_STORAGE_KEY } from "./app/navigation";

function renderShell() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe("AppShell", () => {
  beforeEach(() => {
    localStorage.clear();
  });

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

  it("provides distinct navigation landmarks for sidebar and mobile nav", () => {
    renderShell();

    expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Mobile navigation" })).toBeInTheDocument();
  });

  it("exposes a desktop global search field", () => {
    renderShell();

    expect(screen.getByRole("search")).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Search movies and series" })).toBeInTheDocument();
  });

  it("renders the brand as links home (sidebar and mobile header)", () => {
    renderShell();

    const brands = screen.getAllByRole("link", { name: "Zen-Stream home" });
    expect(brands).toHaveLength(2);
    for (const brand of brands) {
      expect(brand).toHaveAttribute("href", "/");
    }
  });

  it("persists the collapsed preference in localStorage", async () => {
    const user = userEvent.setup();
    renderShell();

    const toggle = screen.getByRole("button", { name: "Collapse sidebar" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    await user.click(toggle);

    expect(localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe("true");
    const expandedButton = screen.getByRole("button", { name: "Expand sidebar" });
    expect(expandedButton).toHaveAttribute("aria-expanded", "false");
  });

  it("restores a persisted collapsed preference on first render", () => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, "true");
    renderShell();

    const toggle = screen.getByRole("button", { name: "Expand sidebar" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});