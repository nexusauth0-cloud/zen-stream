import { useCallback, useEffect, useState } from "react";
import type {
  MediaHomeFeed,
  MediaHomeSubjects,
  MediaInfo,
  MediaSearchResponse,
  MediaSeasonResponse,
  MediaStreamResponse,
} from "@zen-stream/contracts";
import { MediaApiError } from "./client";
import {
  fetchHomeFeed,
  fetchHomeSubjects,
  fetchMediaInfo,
  fetchSeason,
  fetchStream,
  searchMedia,
} from "./media";

export type AsyncStatus = "loading" | "success" | "error";

export interface AsyncState<T> {
  status: AsyncStatus;
  data: T | null;
  error: string | null;
}

const IDLE: AsyncState<never> = { status: "loading", data: null, error: null };

function messageFor(error: unknown): string {
  if (error instanceof MediaApiError) {
    switch (error.code) {
      case "MEDIA_NOT_CONFIGURED":
        return "The media service is not configured yet.";
      case "MEDIA_UPSTREAM_ERROR":
      case "MEDIA_UPSTREAM_INVALID":
        return "The media service is temporarily unavailable. Please try again.";
      case "VALIDATION_ERROR":
        return error.message;
      case "NETWORK_ERROR":
        return "Could not reach the Zen-Stream server. Check your connection.";
      default:
        return "Something went wrong while loading this content.";
    }
  }
  return "Something went wrong while loading this content.";
}

/**
 * Runs an async loader with abort support and a manual retry. Safe under
 * StrictMode: cancelled requests are ignored rather than surfaced as errors.
 * When `enabled` is false the loader is never invoked and the state stays
 * idle ("loading" with no data).
 */
export function useAsyncData<T>(
  load: (signal: AbortSignal) => Promise<T>,
  deps: readonly unknown[],
  enabled = true,
): AsyncState<T> & { retry: () => void } {
  const [state, setState] = useState<AsyncState<T>>(IDLE);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    setState(IDLE);
    load(controller.signal).then(
      (data) => setState({ status: "success", data, error: null }),
      (error: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: "error", data: null, error: messageFor(error) });
      },
    );
    return () => controller.abort();
    // deps are the loader's inputs; attempt re-runs the effect on retry.
  }, [...deps, attempt, enabled]);

  const retry = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  return { ...state, retry };
}

export function useHomeFeed() {
  return useAsyncData<MediaHomeFeed>((signal) => fetchHomeFeed(signal), []);
}

export function useHomeSubjects(opId: string | undefined) {
  return useAsyncData<MediaHomeSubjects>(
    (signal) => fetchHomeSubjects(opId ?? "", signal),
    [opId],
    opId !== undefined,
  );
}

export interface UseSearchOptions {
  keyword: string;
  page?: number;
}

export function useSearch({ keyword, page = 1 }: UseSearchOptions) {
  return useAsyncData<MediaSearchResponse>(
    (signal) => searchMedia({ keyword, page, perPage: 20 }, signal),
    [keyword, page],
  );
}

export function useMediaInfo(subjectId: string | undefined) {
  return useAsyncData<MediaInfo>(
    (signal) => fetchMediaInfo(subjectId ?? "", signal),
    [subjectId],
    subjectId !== undefined,
  );
}

export function useSeason(subjectId: string | undefined) {
  return useAsyncData<MediaSeasonResponse>(
    (signal) => fetchSeason(subjectId ?? "", signal),
    [subjectId],
    subjectId !== undefined,
  );
}

export interface UseStreamOptions {
  subjectId: string | undefined;
  se: number;
  ep: number;
}

export function useStream({ subjectId, se, ep }: UseStreamOptions) {
  return useAsyncData<MediaStreamResponse>(
    (signal) => fetchStream(subjectId ?? "", { se, ep }, signal),
    [subjectId, se, ep],
    subjectId !== undefined,
  );
}