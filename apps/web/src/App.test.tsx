import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";

describe("App", () => {
  it("mounts and renders the foundation page", () => {
    render(<App />);

    expect(screen.getByText(/zen-stream/i, { selector: ".zs-foundation__kicker" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Foundation ready" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Get started" })).toBeInTheDocument();
  });

  it("keeps a correct heading hierarchy with a single h1", () => {
    render(<App />);

    const headings = screen.getAllByRole("heading");
    expect(headings).toHaveLength(1);
    expect(headings[0]?.tagName).toBe("H1");
  });

  it("exposes an interactive primary action", async () => {
    const user = userEvent.setup();
    render(<App />);

    const button = screen.getByRole("button", { name: "Get started" });
    expect(button).toHaveClass("zs-button--primary");
    button.focus();
    expect(button).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(button).toHaveFocus();
  });

  it("labels meaningful icons and hides decorative ones", () => {
    render(<App />);

    const mark = screen.getByRole("img", { name: "Zen-Stream mark" });
    expect(mark).toBeInTheDocument();

    const buttons = within(screen.getByRole("main"));
    expect(buttons.queryByRole("img")).not.toBeNull();
  });
});