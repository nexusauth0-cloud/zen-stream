/**
 * MovieBox provider — the production provider.
 *
 * This is an *adapter*: it keeps the existing typed upstream client
 * (media/client.ts) as the transport, validates raw upstream payloads
 * against the shared contracts exactly as before, and exposes it through
 * the provider abstraction. Existing endpoint behavior is unchanged.
 */
import type { MediaApiConfig } from "../../media/config.js";
import { createMediaClient } from "../../media/client.js";
import type { UpstreamFetch, MediaSearchUpstreamParams, MediaStreamUpstreamParams } from "../../media/client.js";
import type { CombinedProvider } from "../types.js";

export const MOVIEBOX_PROVIDER_ID = "moviebox";

export function createMovieBoxProvider(
  config: MediaApiConfig,
  fetchImpl: UpstreamFetch = fetch,
): CombinedProvider {
  const client = createMediaClient(config, fetchImpl);

  return {
    id: MOVIEBOX_PROVIDER_ID,
    name: "MovieBox",
    fetchHome: () => client.fetchHome(),
    fetchHomeRows: () => client.fetchHomeRows(),
    fetchHomeSubjects: (opId: string) => client.fetchHomeSubjects(opId),
    fetchSearch: (params: MediaSearchUpstreamParams) => client.fetchSearch(params),
    fetchInfo: (subjectId: string) => client.fetchInfo(subjectId),
    fetchSeason: (subjectId: string) => client.fetchSeason(subjectId),
    fetchStream: (subjectId: string, params: MediaStreamUpstreamParams) =>
      client.fetchStream(subjectId, params),
  };
}