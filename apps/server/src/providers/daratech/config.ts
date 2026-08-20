/**
 * DaraTech API configuration.
 *
 * DaraTech is an *optional* server-side secondary metadata provider. The
 * API key lives in the server environment only and is never exposed to
 * browser clients (never use a VITE_-prefixed variable), never committed
 * to Git, and never printed in logs. When the key is unset, DaraTech is
 * simply not registered and all existing behavior is unchanged.
 */

export const DARATECH_DEFAULT_BASE_URL = "https://apimovie.runflix.name.ng/v1";

export interface DaratechConfig {
  apiKey: string;
  apiRoot: string;
}

/** Normalizes a configured base URL so both `...` and `.../v1` roots work. */
export function daratechApiRoot(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`;
}

export function daratechConfig(): DaratechConfig | null {
  const apiKey = process.env.DARATECH_API_KEY?.trim();
  if (!apiKey) return null;
  const baseUrl = process.env.DARATECH_BASE_URL?.trim() || DARATECH_DEFAULT_BASE_URL;
  return { apiKey, apiRoot: daratechApiRoot(baseUrl) };
}

export function isDaratechConfigured(): boolean {
  return daratechConfig() !== null;
}