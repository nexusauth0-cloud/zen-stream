/**
 * Media API configuration.
 *
 * The proxy talks to an external media API (the reference MovieBox-compatible
 * worker). Credentials are read from the server environment only and are
 * never exposed to browser clients.
 */

export interface MediaApiConfig {
  baseUrl: string;
  secret: string;
}

export function mediaApiConfig(): MediaApiConfig | null {
  const baseUrl = process.env.MEDIA_API_BASE_URL?.trim();
  const secret = process.env.MEDIA_API_SECRET;

  if (!baseUrl || !secret) {
    return null;
  }

  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    secret,
  };
}

export function isMediaApiConfigured(): boolean {
  return mediaApiConfig() !== null;
}