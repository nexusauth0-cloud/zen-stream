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

describe("MobileHeader", () => {
  it("renders a compact brand linking home", () => {
    renderAt("/");

    const header = screen.getByRole("banner");
    const brand = within(header).getByRole("link", { name: "Zen-Stream home" });
    expect(brand).toHaveAttribute("href", "/");
    expect(brand.textContent).toContain("Zen-Stream");
  });

  it("offers a search affordance", () => {
    renderAt("/");

    const header = screen.getByRole("banner");
    const search = within(header).getByRole("link", { name: "Search" });
    expect(search).toHaveAttribute("href", "/search");
  });

  it("uses a semantic header landmark", () => {
    renderAt("/");

    expect(document.querySelector("header.zs-mobile-header")).not.toBeNull();
  });
});