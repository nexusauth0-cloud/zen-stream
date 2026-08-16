import {
  homeFeedSchema,
  homeRowsSchema,
  homeSubjectsSchema,
  infoResponseSchema,
  searchResponseSchema,
  seasonResponseSchema,
  streamResponseSchema,
} from "@zen-stream/contracts";
import type { MediaApiConfig } from "./config.js";

export interface MediaSearchUpstreamParams {
  keyword: string;
  page: number;
  perPage: number;
}

export interface MediaStreamUpstreamParams {
  se: number;
  ep: number;
}

export interface MediaUpstreamClient {
  fetchHome(): Promise<unknown>;
  fetchHomeRows(): Promise<unknown>;
  fetchHomeSubjects(opId: string): Promise<unknown>;
  fetchSearch(params: MediaSearchUpstreamParams): Promise<unknown>;
  fetchInfo(subjectId: string): Promise<unknown>;
  fetchSeason(subjectId: string): Promise<unknown>;
  fetchStream(subjectId: string, params: MediaStreamUpstreamParams): Promise<unknown>;
}

/**
 * Minimal fetch surface used by the media client so tests can substitute
 * their own transport without touching Node globals.
 */
export interface UpstreamFetch {
  (url: string, init?: RequestInit): Promise<Response>;
}

const AUTH_HEADER = "X-Worker-Secret";

/**
 * Typed upstream client for the reference MovieBox-compatible media worker.
 *
 * The worker is the only place that knows the upstream secret: routes hand
 * this client validated params and receive the *canonical* Zen-Stream
 * contract payloads back. Raw upstream payloads are validated here, so
 * malformed upstream data never reaches the browser.
 */
export function createMediaClient(
  config: MediaApiConfig,
  fetchImpl: UpstreamFetch = fetch,
): MediaUpstreamClient {
  const baseUrl = config.baseUrl.replace(/\/+$/, "");

  async function request(path: string, init?: RequestInit): Promise<unknown> {
    const response = await fetchImpl(`${baseUrl}${path}`, {
      ...init,
      headers: {
        [AUTH_HEADER]: config.secret,
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw new UpstreamHttpError(response.status, `Upstream media API responded with ${response.status}.`);
    }

    return response.json() as Promise<unknown>;
  }

  return {
    async fetchHome() {
      const raw = await request("/api/v1/home");
      return homeFeedSchema.parse(raw);
    },

    async fetchHomeRows() {
      const raw = await request("/api/v1/home/rows");
      return homeRowsSchema.parse(raw);
    },

    async fetchHomeSubjects(opId: string) {
      const raw = await request(`/api/v1/home/subjects?opId=${encodeURIComponent(opId)}`);
      return homeSubjectsSchema.parse(raw);
    },

    async fetchSearch(params: MediaSearchUpstreamParams) {
      const raw = await request("/api/v1/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: params.keyword,
          page: params.page,
          perPage: params.perPage,
        }),
      });
      return searchResponseSchema.parse(raw);
    },

    async fetchInfo(subjectId: string) {
      const raw = await request(`/api/v1/info/${encodeURIComponent(subjectId)}`);
      return infoResponseSchema.parse(raw);
    },

    async fetchSeason(subjectId: string) {
      const raw = await request(`/api/v1/season/${encodeURIComponent(subjectId)}`);
      return seasonResponseSchema.parse(raw);
    },

    async fetchStream(subjectId: string, params: MediaStreamUpstreamParams) {
      const raw = await request(
        `/api/v1/stream/${encodeURIComponent(subjectId)}?se=${params.se}&ep=${params.ep}`,
      );
      return streamResponseSchema.parse(raw);
    },
  };
}

export class UpstreamHttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "UpstreamHttpError";
    this.status = status;
  }
}