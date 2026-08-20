/**
 * Server-side TMDB v3 client.
 *
 * Centralizes the TMDB base URL, authentication header, error mapping and
 * response validation for every TMDB call. Routes and adapters never touch
 * the TMDB API directly and never see the API key.
 *
 * Error semantics:
 *  - HTTP 401/403/429/5xx → {@link UpstreamHttpError} with the TMDB status
 *  - transport failures (network/timeout) → {@link UpstreamHttpError} 502
 *  - invalid payloads → ZodError
 * The media routes translate all of these into the canonical 502 family.
 */
import type { UpstreamFetch } from "../../media/client.js";
import { UpstreamHttpError } from "../../media/client.js";
import type { TmdBApiConfig } from "./config.js";
import {
  tmdbGenreListSchema,
  tmdbMovieDetailsSchema,
  tmdbSearchPageSchema,
  tmdbTvDetailsSchema,
} from "./types.js";
import type { TmdBGenre, TmdBMovieDetails, TmdBSearchPage, TmdBTvDetails } from "./types.js";

export const TMDB_API_BASE_URL = "https://api.themoviedb.org/3";

export interface TmdBSearchParams {
  keyword: string;
  page: number;
}

export interface TmdBClient {
  searchMulti(params: TmdBSearchParams): Promise<TmdBSearchPage>;
  fetchMovie(id: number): Promise<TmdBMovieDetails>;
  fetchTv(id: number): Promise<TmdBTvDetails>;
  fetchGenres(kind: "movie" | "tv"): Promise<TmdBGenre[]>;
  health(): Promise<void>;
}

// Genre lists are small and stable; cache them for an hour so search results
// can map genre ids to names without a TMDB call per search.
const GENRES_CACHE_TTL_MS = 60 * 60 * 1000;
const genreCache = new Map<"movie" | "tv", { at: number; genres: TmdBGenre[] }>();

/** Test hook: clears the module-level genre cache. */
export function resetTmdBGenreCache(): void {
  genreCache.clear();
}

export function createTmdBClient(config: TmdBApiConfig, fetchImpl: UpstreamFetch = fetch): TmdBClient {
  async function request(path: string): Promise<unknown> {
    let response: Response;
    try {
      response = await fetchImpl(`${TMDB_API_BASE_URL}${path}`, {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          Accept: "application/json",
        },
      });
    } catch {
      throw new UpstreamHttpError(502, "TMDB could not be reached.");
    }

    if (!response.ok) {
      // 401/403 (bad/expired key), 429 (rate limit) and 5xx all surface as
      // upstream failures — the routes translate them into the canonical
      // 502 MEDIA_UPSTREAM_ERROR family.
      throw new UpstreamHttpError(response.status, `TMDB responded with ${response.status}.`);
    }

    try {
      return (await response.json()) as unknown;
    } catch {
      throw new UpstreamHttpError(
        response.status,
        `TMDB returned a non-JSON response (${response.status}).`,
      );
    }
  }

  return {
    async searchMulti(params: TmdBSearchParams): Promise<TmdBSearchPage> {
      const query = new URLSearchParams({
        query: params.keyword,
        page: String(params.page),
        include_adult: "false",
        language: "en-US",
      });
      const raw = await request(`/search/multi?${query.toString()}`);
      return tmdbSearchPageSchema.parse(raw);
    },

    async fetchMovie(id: number): Promise<TmdBMovieDetails> {
      const query = new URLSearchParams({
        language: "en-US",
        append_to_response: "external_ids",
      });
      const raw = await request(`/movie/${id}?${query.toString()}`);
      return tmdbMovieDetailsSchema.parse(raw);
    },

    async fetchTv(id: number): Promise<TmdBTvDetails> {
      const query = new URLSearchParams({
        language: "en-US",
        append_to_response: "external_ids",
      });
      const raw = await request(`/tv/${id}?${query.toString()}`);
      return tmdbTvDetailsSchema.parse(raw);
    },

    async fetchGenres(kind: "movie" | "tv"): Promise<TmdBGenre[]> {
      const cached = genreCache.get(kind);
      if (cached && Date.now() - cached.at < GENRES_CACHE_TTL_MS) {
        return cached.genres;
      }

      const raw = await request(`/genre/${kind}/list?language=en-US`);
      const genres = tmdbGenreListSchema.parse(raw).genres;

      genreCache.set(kind, { at: Date.now(), genres });
      return genres;
    },

    async health(): Promise<void> {
      await request("/configuration?language=en-US");
    },
  };
}
