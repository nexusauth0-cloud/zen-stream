/**
 * Spün Media metadata provider.
 *
 * Secondary, metadata/discovery-only provider registered behind the same
 * provider abstraction as MovieBox. It never serves playback: info payloads
 * always carry `hasResource: false`, so the availability model never treats
 * a Spün title as playable. Subject ids are translated between MovieBox
 * numeric ids and Spün slugs through Spün's `/utility/resolve/moviebox`
 * namespace; the requested id is preserved as the canonical subject id so
 * deep links stay stable.
 */
import type { ProviderStatus } from "@zen-stream/contracts";
import type { UpstreamFetch, MediaSearchUpstreamParams } from "../../media/client.js";
import { UpstreamHttpError } from "../../media/client.js";
import type { SecondaryMetadataProvider } from "../types.js";
import type { SpunMediaConfig } from "./config.js";
import { createSpunClient } from "./client.js";
import { spunInfoToResponse, spunSearchToResponse } from "./adapter.js";
import { isMovieBoxId, isSpunId, staticIdentityForSubject } from "../identity.js";
import type { ResolvedIdentity } from "../identity.js";

export const SPUN_PROVIDER_ID = "spun";

export function createSpunProvider(
  config: SpunMediaConfig,
  fetchImpl: UpstreamFetch = fetch,
): SecondaryMetadataProvider {
  const client = createSpunClient(config, fetchImpl);

  async function resolveIdentity(subjectId: string): Promise<{ spunId: string; identity: ResolvedIdentity }> {
    if (isSpunId(subjectId)) {
      return { spunId: subjectId, identity: staticIdentityForSubject(subjectId) };
    }
    if (isMovieBoxId(subjectId)) {
      const result = await client.resolve("moviebox", subjectId);
      if (!result) {
        throw new UpstreamHttpError(404, `Spün does not know MovieBox id ${subjectId}`);
      }
      return {
        spunId: result.spun_id,
        identity: { ...staticIdentityForSubject(subjectId), spun: result.spun_id },
      };
    }
    throw new UpstreamHttpError(404, `Unknown Spün subject id: ${subjectId}`);
  }

  return {
    id: SPUN_PROVIDER_ID,
    name: "Spün",

    async fetchSearch(params: MediaSearchUpstreamParams) {
      const page = await client.search({ keyword: params.keyword, page: params.page });
      return spunSearchToResponse(params, page);
    },

    async fetchInfo(subjectId: string) {
      const { spunId, identity } = await resolveIdentity(subjectId);
      return spunInfoToResponse(subjectId, await client.info(spunId), identity);
    },

    async health(): Promise<ProviderStatus> {
      try {
        const result = await client.health();
        return result.status === "ok" ? "healthy" : "degraded";
      } catch {
        return "offline";
      }
    },
  };
}