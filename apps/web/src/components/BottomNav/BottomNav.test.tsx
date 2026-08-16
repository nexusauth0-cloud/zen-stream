import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "../../App";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
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

    expect(labels).toEqual(["Home", "Movies", "Search", "My List", "Account"]);
  });

  it("marks the active destination with aria-current", () => {
    renderAt("/account");

    const nav = screen.getByRole("navigation", { name: "Mobile navigation" });
    const account = within(nav).getByRole("link", { name: /Account/i });
    expect(account).toHaveAttribute("aria-current", "page");
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