/**
 * Server-side DaraTech client.
 *
 * Centralizes the DaraTech base URL, bearer authentication, request
 * timeout, error mapping and response validation for every DaraTech call.
 * Routes and adapters never touch the DaraTech API directly and never see
 * the API key — it is attached here from the server environment only.
 *
 * Error semantics:
 *  - HTTP 401/403 (bad/expired key), 429 (rate limit), 5xx → typed
 *    {@link UpstreamHttpError} with the DaraTech status
 *  - transport failures (network/timeout) → {@link UpstreamHttpError} 502
 *  - invalid payloads → ZodError
 * The media routes translate all of these into the canonical 502 family.
 */
import type { UpstreamFetch } from "../../media/client.js";
import { UpstreamHttpError } from "../../media/client.js";
import type { DaratechConfig } from "./config.js";
import {
  daratechDetailSchema,
  daratechHealthSchema,
  daratechSearchResponseSchema,
} from "./types.js";
import type { DaratechDetail, DaratechSearchResponse } from "./types.js";

export const DARATECH_REQUEST_TIMEOUT_MS = 10_000;

export interface DaratechSearchParams {
  keyword: string;
  page: number;
}

export interface DaratechClient {
  search(params: DaratechSearchParams): Promise<DaratechSearchResponse>;
  detail(id: string): Promise<DaratechDetail>;
  health(): Promise<{ status: string; success: boolean | null }>;
}

export function createDaratechClient(config: DaratechConfig, fetchImpl: UpstreamFetch = fetch): DaratechClient {
  const apiRoot = config.apiRoot.replace(/\/+$/, "");

  async function request(path: string): Promise<unknown> {
    let response: Response;
    try {
      response = await fetchImpl(`${apiRoot}${path}`, {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(DARATECH_REQUEST_TIMEOUT_MS),
      });
    } catch {
      throw new UpstreamHttpError(502, "DaraTech could not be reached.");
    }

    if (!response.ok) {
      // 401/403 (bad/expired key), 429 (rate limit) and 5xx all surface as
      // upstream failures — the routes translate them into the canonical
      // 502 MEDIA_UPSTREAM_ERROR family. The status is preserved so callers
      // can distinguish rate limiting from hard failures.
      throw new UpstreamHttpError(response.status, `DaraTech responded with ${response.status}.`);
    }

    try {
      return (await response.json()) as unknown;
    } catch {
      throw new UpstreamHttpError(
        response.status,
        `DaraTech returned a non-JSON response (${response.status}).`,
      );
    }
  }

  return {
    async search(params: DaratechSearchParams): Promise<DaratechSearchResponse> {
      const query = new URLSearchParams({ q: params.keyword, page: String(params.page) });
      const raw = await request(`/search?${query.toString()}`);
      return daratechSearchResponseSchema.parse(raw);
    },

    async detail(id: string): Promise<DaratechDetail> {
      const raw = await request(`/detail/${encodeURIComponent(id)}`);
      return daratechDetailSchema.parse(raw);
    },

    async health(): Promise<{ status: string; success: boolean | null }> {
      const raw = await request("/health");
      return daratechHealthSchema.parse(raw);
    },
  };
}