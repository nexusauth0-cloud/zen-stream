import {
  homeFeedSchema,
  homeRowsSchema,
  homeSubjectsSchema,
  infoResponseSchema,
  searchResponseSchema,
  seasonResponseSchema,
  streamResponseSchema,
} from "@zen-stream/contracts";
import type {
  MediaHomeFeed,
  MediaHomeRows,
  MediaHomeSubjects,
  MediaInfo,
  MediaSearchResponse,
  MediaSeasonResponse,
  MediaStreamResponse,
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
  fetchHome(): Promise<MediaHomeFeed>;
  fetchHomeRows(): Promise<MediaHomeRows>;
  fetchHomeSubjects(opId: string): Promise<MediaHomeSubjects>;
  fetchSearch(params: MediaSearchUpstreamParams): Promise<MediaSearchResponse>;
  fetchInfo(subjectId: string): Promise<MediaInfo>;
  fetchSeason(subjectId: string): Promise<MediaSeasonResponse>;
  fetchStream(subjectId: string, params: MediaStreamUpstreamParams): Promise<MediaStreamResponse>;
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
    let response: Response;
    try {
      response = await fetchImpl(`${baseUrl}${path}`, {
        ...init,
        headers: {
          [AUTH_HEADER]: config.secret,
          ...(init?.headers ?? {}),
        },
      });
    } catch {
      // Transport-level failure (DNS, connection reset, timeout, abort) —
      // distinct from an HTTP error response. Surface it through the same
      // retryable 502 channel so the client never sees a raw 500.
      throw new UpstreamHttpError(502, "The media API could not be reached.");
    }

    if (!response.ok) {
      throw new UpstreamHttpError(response.status, `Upstream media API responded with ${response.status}.`);
    }

    // A transient upstream/relay failure can yield a non-JSON body (empty
    // response, gateway page). Treat that as a retryable upstream error
    // instead of letting the JSON parse blow up into a 500 INTERNAL_ERROR.
    try {
      return (await response.json()) as unknown;
    } catch {
      throw new UpstreamHttpError(
        response.status,
        `Upstream media API returned a non-JSON response (${response.status}).`,
      );
    }
  }

  return {
    async fetchHome() {
      const raw = await request("/home");
      return homeFeedSchema.parse(raw);
    },

    async fetchHomeRows() {
      const raw = await request("/home/rows");
      return homeRowsSchema.parse(raw);
    },

    async fetchHomeSubjects(opId: string) {
      const raw = await request(`/home/subjects?opId=${encodeURIComponent(opId)}`);
      return homeSubjectsSchema.parse(raw);
    },

    async fetchSearch(params: MediaSearchUpstreamParams) {
      const raw = await request("/search", {
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
      const raw = await request(`/info/${encodeURIComponent(subjectId)}`);
      return infoResponseSchema.parse(raw);
    },

    async fetchSeason(subjectId: string) {
      const raw = await request(`/season/${encodeURIComponent(subjectId)}`);
      return seasonResponseSchema.parse(raw);
    },

    async fetchStream(subjectId: string, params: MediaStreamUpstreamParams) {
      const raw = await request(
        `/stream/${encodeURIComponent(subjectId)}?se=${params.se}&ep=${params.ep}`,
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