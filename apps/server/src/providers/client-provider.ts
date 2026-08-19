/**
 * Generic adapter that exposes any {@link MediaUpstreamClient} through the
 * provider interfaces. Used when a client is injected (tests) or when a
 * provider only needs the shared transport surface.
 */
import type { MediaUpstreamClient, MediaSearchUpstreamParams, MediaStreamUpstreamParams } from "../media/client.js";
import type { CombinedProvider } from "./types.js";

export function createClientProvider(client: MediaUpstreamClient, id = "client", name = "Upstream client"): CombinedProvider {
  return {
    id,
    name,
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