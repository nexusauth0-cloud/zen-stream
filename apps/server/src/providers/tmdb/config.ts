/**
 * TMDB API configuration.
 *
 * TMDB is an *optional* server-side secondary metadata provider. The API key
 * lives in the server environment only and is never exposed to browser
 * clients (never use a VITE_-prefixed variable). When unset, TMDB is simply
 * not registered and all existing behavior is unchanged.
 */

export interface TmdBApiConfig {
  apiKey: string;
}

export function tmdbApiConfig(): TmdBApiConfig | null {
  const apiKey = process.env.TMDB_API_KEY?.trim();
  return apiKey ? { apiKey } : null;
}

export function isTmdBApiConfigured(): boolean {
  return tmdbApiConfig() !== null;
}
