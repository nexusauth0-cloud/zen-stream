import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useHomeFeed, useMediaInfo, useSeason, useSearch } from "./hooks";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const FEED_BODY = {
  total: 0,
  rows: [
    {
      title: "Nollywood Movie",
      opId: "op-1",
      type: "SUBJECTS_MOVIE",
      total: 0,
      subjects: [],
    },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useHomeFeed", () => {
  it("resolves to success with data", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(FEED_BODY)));

    const { result } = renderHook(() => useHomeFeed());

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.data?.rows[0]?.title).toBe("Nollywood Movie");
  });

  it("surfaces a friendly error message on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ error: { code: "MEDIA_UPSTREAM_ERROR", message: "x" } }, 502)),
    );

    const { result } = renderHook(() => useHomeFeed());

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).toContain("temporarily unavailable");
  });

  it("retries after a failure", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: { code: "X", message: "x" } }, 500))
      .mockResolvedValueOnce(jsonResponse(FEED_BODY));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useHomeFeed());

    await waitFor(() => expect(result.current.status).toBe("error"));
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.status).toBe("success"));
  });
});

describe("useSearch", () => {
  it("refetches when the keyword changes", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => jsonResponse({ items: [], pager: {} }));
    vi.stubGlobal("fetch", fetchMock);

    const { rerender } = renderHook(({ keyword }) => useSearch({ keyword }), {
      initialProps: { keyword: "avatar" },
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    rerender({ keyword: "matrix" });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    const [firstUrl, secondUrl] = [fetchMock.mock.calls[0]![0], fetchMock.mock.calls[1]![0]];
    expect(firstUrl).toContain("q=avatar");
    expect(secondUrl).toContain("q=matrix");
  });
});

describe("useMediaInfo / useSeason", () => {
  it("skips loading while the subject id is missing", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);

    renderHook(() => useMediaInfo(undefined));
    renderHook(() => useSeason(undefined));

    expect(fetchMock).not.toHaveBeenCalled();
  });
});