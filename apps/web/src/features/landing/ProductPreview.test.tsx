import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ProductPreview } from "./ProductPreview";
import { FEATURED_TITLE, LANDING_COPY } from "./fixtures";

describe("ProductPreview", () => {
  it("renders the desktop and mobile preview frames", () => {
    render(<ProductPreview />);

    expect(screen.getByTestId("product-preview-desktop")).toBeInTheDocument();
    expect(screen.getByTestId("product-preview-mobile")).toBeInTheDocument();
  });

  it("is presentation-only: no interactive controls inside the frames", () => {
    render(<ProductPreview />);

    const desktop = screen.getByTestId("product-preview-desktop");
    expect(within(desktop).queryByRole("link")).not.toBeInTheDocument();
    expect(within(desktop).queryByRole("button")).not.toBeInTheDocument();

    const mobile = screen.getByTestId("product-preview-mobile");
    expect(within(mobile).queryByRole("link")).not.toBeInTheDocument();
    expect(within(mobile).queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders fixture content inside the frames", () => {
    render(<ProductPreview />);

    const desktop = screen.getByTestId("product-preview-desktop");
    expect(within(desktop).getAllByText(FEATURED_TITLE.title).length).toBeGreaterThanOrEqual(1);
    expect(within(desktop).getByText(/search movies and series/i)).toBeInTheDocument();

    const mobile = screen.getByTestId("product-preview-mobile");
    expect(within(mobile).getByText("Zen-Stream")).toBeInTheDocument();
  });

  it("labels the section with heading and support copy", () => {
    render(<ProductPreview />);

    expect(screen.getByRole("heading", { level: 2, name: LANDING_COPY.previewTitle })).toBeInTheDocument();
    expect(screen.getByText(LANDING_COPY.previewSupport)).toBeInTheDocument();
  });
});