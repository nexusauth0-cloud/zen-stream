import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";

describe("Button", () => {
  it("renders a semantic button with an accessible name", () => {
    render(<Button>Get started</Button>);

    const button = screen.getByRole("button", { name: "Get started" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "button");
  });

  it("applies variant and size classes", () => {
    render(
      <Button variant="secondary" size="sm">
        Secondary
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Secondary" });
    expect(button).toHaveClass("zs-button", "zs-button--secondary", "zs-button--sm");
  });

  it("is disabled and does not fire clicks when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Disabled
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Disabled" });
    expect(button).toBeDisabled();

    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("is keyboard focusable and fires clicks on Enter", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Activate</Button>);

    const button = screen.getByRole("button", { name: "Activate" });
    button.focus();
    expect(button).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});