import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Icon } from "./Icon";

describe("Icon", () => {
  it("is decorative and hidden from assistive technology by default", () => {
    const { container } = render(
      <Icon>
        <path d="M0 0h24v24H0z" />
      </Icon>,
    );

    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).not.toHaveAttribute("role");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("is meaningful with an accessible name when a label is provided", () => {
    render(
      <Icon label="Play">
        <path d="M0 0h24v24H0z" />
      </Icon>,
    );

    const svg = screen.getByRole("img", { name: "Play" });
    expect(svg).not.toHaveAttribute("aria-hidden");
  });

  it("applies an explicit size", () => {
    const { container } = render(
      <Icon size={20}>
        <path d="M0 0h24v24H0z" />
      </Icon>,
    );

    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "20");
    expect(svg).toHaveAttribute("height", "20");
  });
});