/**
 * Spün Media API configuration.
 *
 * Spün's public endpoints require no client API key, so the provider is
 * enabled whenever the base URL is configured (it defaults to the
 * documented public root). SPUN_MEDIA_BASE_URL is read from the server
 * environment only; there is no browser-facing credential.
 */

export const SPUN_MEDIA_DEFAULT_BASE_URL = "https://media.byspun.xyz/v1";

export interface SpunMediaConfig {
  baseUrl: string;
}

export function spunMediaConfig(): SpunMediaConfig {
  const baseUrl = (process.env.SPUN_MEDIA_BASE_URL?.trim() || SPUN_MEDIA_DEFAULT_BASE_URL).replace(/\/+$/, "");
  return { baseUrl };
}

export function isSpunMediaConfigured(): boolean {
  return true;
}