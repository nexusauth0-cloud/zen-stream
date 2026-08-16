import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "../../App";
import { SIDEBAR_MICROCOPY, SIDEBAR_STORAGE_KEY } from "../../app/navigation";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

function getSidebar() {
  return screen.getByTestId("sidebar");
}

function getSidebarNav() {
  return within(screen.getByRole("navigation", { name: "Primary navigation" }));
}

describe("Sidebar", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("groups navigation into primary, secondary, and account sections", () => {
    renderAt("/");

    const primary = within(screen.getByTestId("nav-primary"));
    expect(primary.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(primary.getByRole("link", { name: "Movies" })).toBeInTheDocument();
    expect(primary.getByRole("link", { name: "Series" })).toBeInTheDocument();
    expect(primary.getByRole("link", { name: "Search" })).toBeInTheDocument();

    const secondary = within(screen.getByTestId("nav-secondary"));
    expect(secondary.getByRole("link", { name: "My List" })).toBeInTheDocument();
    expect(secondary.getByRole("link", { name: "History" })).toBeInTheDocument();

    const account = within(screen.getByTestId("nav-account"));
    expect(account.getByRole("link", { name: "Account" })).toBeInTheDocument();
  });

  it("starts expanded with a descriptive collapse control", () => {
    renderAt("/");

    const toggle = screen.getByRole("button", { name: "Collapse sidebar" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveAttribute("aria-controls", "zs-sidebar-nav");
    expect(within(getSidebar()).getByRole("link", { name: "Zen-Stream home" })).toBeInTheDocument();
  });

  it("collapses to an icon-only rail while keeping labels accessible", async () => {
    const user = userEvent.setup();
    renderAt("/");

    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));

    expect(getSidebar()).toHaveAttribute("data-collapsed", "true");
    // Labels are visually hidden but still in the accessibility tree.
    expect(getSidebarNav().getByRole("link", { name: "Movies" })).toBeInTheDocument();
    expect(localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe("true");
  });

  it("toggles via keyboard (Enter)", async () => {
    const user = userEvent.setup();
    renderAt("/");

    const toggle = screen.getByRole("button", { name: "Collapse sidebar" });
    toggle.focus();
    expect(toggle).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(screen.getByRole("button", { name: "Expand sidebar" })).toHaveAttribute("aria-expanded", "false");
  });

  it("marks the active route without turning the whole rail amber", () => {
    renderAt("/series");

    const series = getSidebarNav().getByRole("link", { name: "Series" });
    expect(series).toHaveAttribute("aria-current", "page");
    expect(series).toHaveClass("zs-nav-item--active");

    const home = getSidebarNav().getByRole("link", { name: "Home" });
    expect(home).not.toHaveAttribute("aria-current");
    expect(home).not.toHaveClass("zs-nav-item--active");
  });

  it("shows the supporting microcopy", () => {
    renderAt("/");

    expect(screen.getByText(SIDEBAR_MICROCOPY)).toBeInTheDocument();
  });

  it("keeps the microcopy in the DOM when collapsed (visually hidden via CSS)", async () => {
    const user = userEvent.setup();
    renderAt("/");

    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));

    expect(getSidebar()).toHaveAttribute("data-collapsed", "true");
    expect(screen.getByText(SIDEBAR_MICROCOPY)).toBeInTheDocument();
  });
});