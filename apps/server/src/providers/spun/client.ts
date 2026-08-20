/**
 * Server-side Spün Media client.
 *
 * Centralizes the Spün base URL, request timeout, error mapping and
 * response validation for every Spün call. Routes and adapters never touch
 * the Spün API directly. Spün's public endpoints require no API key, so no
 * credential is attached here.
 *
 * Error semantics:
 *  - HTTP 404/4xx/5xx → {@link UpstreamHttpError} with the Spün status
 *  - transport failures (network/timeout) → {@link UpstreamHttpError} 502
 *  - invalid payloads → ZodError
 * The media routes translate all of these into the canonical 502 family.
 */
import type { UpstreamFetch } from "../../media/client.js";
import { UpstreamHttpError } from "../../media/client.js";
import type { SpunMediaConfig } from "./config.js";
import {
  spunHealthSchema,
  spunInfoSchema,
  spunResolveNamespaceSchema,
  spunResolveResultSchema,
  spunSearchPageSchema,
} from "./types.js";
import type { SpunInfo, SpunResolveNamespace, SpunResolveResult, SpunSearchPage } from "./types.js";

export const SPUN_REQUEST_TIMEOUT_MS = 10_000;

export interface SpunSearchParams {
  keyword: string;
  page: number;
}

export interface SpunClient {
  search(params: SpunSearchParams): Promise<SpunSearchPage>;
  info(spunId: string): Promise<SpunInfo>;
  resolve(namespace: SpunResolveNamespace, id: string): Promise<SpunResolveResult | null>;
  health(): Promise<{ status: string }>;
}

export function createSpunClient(config: SpunMediaConfig, fetchImpl: UpstreamFetch = fetch): SpunClient {
  const baseUrl = config.baseUrl.replace(/\/+$/, "");

  async function request(path: string): Promise<unknown> {
    let response: Response;
    try {
      response = await fetchImpl(`${baseUrl}${path}`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(SPUN_REQUEST_TIMEOUT_MS),
      });
    } catch {
      throw new UpstreamHttpError(502, "Spün Media could not be reached.");
    }

    if (!response.ok) {
      // 404 (unknown title), 4xx and 5xx all surface as upstream failures —
      // the routes translate them into the canonical 502 family. A 404 keeps
      // its status so callers can treat it as "this provider does not know
      // this title".
      throw new UpstreamHttpError(response.status, `Spün Media responded with ${response.status}.`);
    }

    try {
      return (await response.json()) as unknown;
    } catch {
      throw new UpstreamHttpError(
        response.status,
        `Spün Media returned a non-JSON response (${response.status}).`,
      );
    }
  }

  return {
    async search(params: SpunSearchParams): Promise<SpunSearchPage> {
      const query = new URLSearchParams({ q: params.keyword, page: String(params.page) });
      const raw = await request(`/search?${query.toString()}`);
      return spunSearchPageSchema.parse(raw);
    },

    async info(spunId: string): Promise<SpunInfo> {
      const raw = await request(`/info/${encodeURIComponent(spunId)}`);
      return spunInfoSchema.parse(raw);
    },

    async resolve(namespace: SpunResolveNamespace, id: string): Promise<SpunResolveResult | null> {
      if (!spunResolveNamespaceSchema.safeParse(namespace).success) {
        throw new UpstreamHttpError(400, `Unknown Spün resolve namespace: ${namespace}`);
      }
      const raw = await request(`/utility/resolve/${namespace}?id=${encodeURIComponent(id)}`);
      return spunResolveResultSchema.parse(raw);
    },

    async health(): Promise<{ status: string }> {
      const raw = await request("/utility/health");
      return spunHealthSchema.parse(raw);
    },
  };
}