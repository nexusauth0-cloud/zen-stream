import type {
  MediaHomeFeed,
  MediaHomeRows,
  MediaHomeSubjects,
  MediaInfo,
  MediaSearchResponse,
  MediaSeasonResponse,
  MediaStreamResponse,
} from "@zen-stream/contracts";
import { fetchJson } from "./client";

export interface SearchMediaParams {
  keyword: string;
  page?: number;
  perPage?: number;
}

export interface StreamParams {
  se: number;
  ep: number;
}

/**
 * Shared search boundary: every entry point (header, search page, tests)
 * funnels through this normalization so "From", "from" and "FROM" all
 * query the catalog identically.
 */
export function normalizeSearchKeyword(keyword: string): string {
  return keyword.trim().toLowerCase();
}

function signalOption(signal?: AbortSignal): { signal?: AbortSignal } {
  return signal ? { signal } : {};
}

export function fetchHomeFeed(signal?: AbortSignal): Promise<MediaHomeFeed> {
  return fetchJson<MediaHomeFeed>("/api/v1/media/home", signalOption(signal));
}

export function fetchHomeRows(signal?: AbortSignal): Promise<MediaHomeRows> {
  return fetchJson<MediaHomeRows>("/api/v1/media/home/rows", signalOption(signal));
}

export function fetchHomeSubjects(opId: string, signal?: AbortSignal): Promise<MediaHomeSubjects> {
  const query = new URLSearchParams({ opId });
  return fetchJson<MediaHomeSubjects>(`/api/v1/media/home/subjects?${query}`, signalOption(signal));
}

export function searchMedia(
  params: SearchMediaParams,
  signal?: AbortSignal,
): Promise<MediaSearchResponse> {
  const query = new URLSearchParams({
    q: normalizeSearchKeyword(params.keyword),
    page: String(params.page ?? 1),
    perPage: String(params.perPage ?? 20),
  });
  return fetchJson<MediaSearchResponse>(`/api/v1/media/search?${query}`, signalOption(signal));
}

export function fetchMediaInfo(subjectId: string, signal?: AbortSignal): Promise<MediaInfo> {
  return fetchJson<MediaInfo>(`/api/v1/media/info/${encodeURIComponent(subjectId)}`, signalOption(signal));
}

export function fetchSeason(subjectId: string, signal?: AbortSignal): Promise<MediaSeasonResponse> {
  return fetchJson<MediaSeasonResponse>(
    `/api/v1/media/season/${encodeURIComponent(subjectId)}`,
    signalOption(signal),
  );
}

export function fetchStream(
  subjectId: string,
  params: StreamParams,
  signal?: AbortSignal,
): Promise<MediaStreamResponse> {
  const query = new URLSearchParams({ se: String(params.se), ep: String(params.ep) });
  return fetchJson<MediaStreamResponse>(
    `/api/v1/media/stream/${encodeURIComponent(subjectId)}?${query}`,
    signalOption(signal),
  );
}