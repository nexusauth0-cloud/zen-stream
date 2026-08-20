/**
 * TMDB metadata provider.
 *
 * Secondary, metadata/discovery-only provider registered behind the same
 * provider abstraction as MovieBox. It never serves playback: info payloads
 * always carry `hasResource: false`, so the availability model never treats
 * a TMDB title as playable.
 */
import type { UpstreamFetch, MediaSearchUpstreamParams } from "../../media/client.js";
import type { SecondaryMetadataProvider } from "../types.js";
import type { TmdBApiConfig } from "./config.js";
import { createTmdBClient } from "./client.js";
import { parseTmdBSubjectId, tmdbInfoToResponse, tmdbSearchToResponse } from "./adapter.js";

export const TMDB_PROVIDER_ID = "tmdb";

export function createTmdBProvider(
  config: TmdBApiConfig,
  fetchImpl: UpstreamFetch = fetch,
): SecondaryMetadataProvider {
  const client = createTmdBClient(config, fetchImpl);

  return {
    id: TMDB_PROVIDER_ID,
    name: "TMDB",
    async fetchSearch(params: MediaSearchUpstreamParams) {
      const page = await client.searchMulti({ keyword: params.keyword, page: params.page });
      const [movieGenres, tvGenres] = await Promise.all([
        client.fetchGenres("movie"),
        client.fetchGenres("tv"),
      ]);
      return tmdbSearchToResponse(
        { keyword: params.keyword, page: params.page, perPage: params.perPage },
        page,
        [...movieGenres, ...tvGenres],
      );
    },
    async fetchInfo(subjectId: string) {
      const parsed = parseTmdBSubjectId(subjectId);
      if (parsed.kind === "movie") {
        return tmdbInfoToResponse(await client.fetchMovie(parsed.id));
      }
      return tmdbInfoToResponse(await client.fetchTv(parsed.id));
    },
  };
}