import { describe, expect, it, vi } from "vitest";
import { canShare, realShareCapabilities, shareMedia } from "./share";
import type { ShareCapabilities } from "./share";

const PAYLOAD = { url: "https://zen.example/movie/123", title: "Supernatural" };

function caps(overrides: Partial<ShareCapabilities> = {}): ShareCapabilities {
  return overrides;
}

describe("shareMedia", () => {
  it("uses the native share sheet when available", async () => {
    const share = vi.fn(async () => undefined);
    expect(await shareMedia(PAYLOAD, caps({ share }))).toBe("shared");
    expect(share).toHaveBeenCalledWith(PAYLOAD);
  });

  it("treats an aborted native share as cancelled, without copying", async () => {
    const share = vi.fn(async () => {
      throw new DOMException("Aborted", "AbortError");
    });
    const clipboard = { writeText: vi.fn(async () => undefined) };
    expect(await shareMedia(PAYLOAD, caps({ share, clipboard }))).toBe("cancelled");
    expect(clipboard.writeText).not.toHaveBeenCalled();
  });

  it("falls back to the clipboard when the share sheet rejects", async () => {
    const share = vi.fn(async () => {
      throw new Error("not allowed");
    });
    const clipboard = { writeText: vi.fn(async () => undefined) };
    expect(await shareMedia(PAYLOAD, caps({ share, clipboard }))).toBe("copied");
    expect(clipboard.writeText).toHaveBeenCalledWith(PAYLOAD.url);
  });

  it("copies the URL via the clipboard API when there is no share sheet", async () => {
    const clipboard = { writeText: vi.fn(async () => undefined) };
    expect(await shareMedia(PAYLOAD, caps({ clipboard }))).toBe("copied");
    expect(clipboard.writeText).toHaveBeenCalledWith(PAYLOAD.url);
  });

  it("falls through to the legacy copy when the clipboard API rejects", async () => {
    const clipboard = { writeText: vi.fn(async () => {
      throw new Error("denied");
    }) };
    const fallbackCopy = vi.fn(() => true);
    expect(await shareMedia(PAYLOAD, caps({ clipboard, fallbackCopy }))).toBe("copied");
    expect(fallbackCopy).toHaveBeenCalledWith(PAYLOAD.url);
  });

  it("reports unsupported when no path exists", async () => {
    expect(await shareMedia(PAYLOAD, caps({}))).toBe("unsupported");
  });
});

describe("canShare", () => {
  it("accepts any working path and rejects null or empty capabilities", () => {
    expect(canShare({ share: async () => undefined })).toBe(true);
    expect(canShare({ clipboard: { writeText: async () => undefined } })).toBe(true);
    expect(canShare({ fallbackCopy: () => true })).toBe(true);
    expect(canShare({})).toBe(false);
    expect(canShare(null)).toBe(false);
  });
});

describe("realShareCapabilities", () => {
  it("reflects the current navigator without throwing", () => {
    const caps = realShareCapabilities();
    expect(caps === null || typeof caps === "object").toBe(true);
  });
});