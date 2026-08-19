import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ShareButton } from "./ShareButton";

describe("ShareButton", () => {
  it("copies the canonical URL and confirms with Link copied", async () => {
    const user = userEvent.setup();
    const clipboard = { writeText: vi.fn(async () => undefined) };
    render(
      <MemoryRouter>
        <ShareButton url="/movie/123" title="Harbor Lights" capabilities={{ clipboard }} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Share Harbor Lights" }));
    expect(clipboard.writeText).toHaveBeenCalledWith("/movie/123");
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Link copied" })).toBeInTheDocument();
    });
  });

  it("uses the native share sheet when available", async () => {
    const user = userEvent.setup();
    const share = vi.fn(async () => undefined);
    render(
      <MemoryRouter>
        <ShareButton url="/movie/123" title="Harbor Lights" capabilities={{ share }} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Share Harbor Lights" }));
    expect(share).toHaveBeenCalledWith({ title: "Harbor Lights", url: "/movie/123" });
    expect(screen.getByRole("button", { name: "Share Harbor Lights" })).toBeInTheDocument();
  });

  it("hides entirely when the browser supports no sharing path", () => {
    render(
      <MemoryRouter>
        <ShareButton url="/movie/123" capabilities={{}} />
      </MemoryRouter>,
    );
    expect(screen.queryByRole("button", { name: /share/i })).not.toBeInTheDocument();
  });
});