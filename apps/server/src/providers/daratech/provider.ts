/**
 * DaraTech metadata provider.
 *
 * Secondary, metadata/discovery-only provider registered behind the same
 * provider abstraction as MovieBox. It never serves playback: info payloads
 * always carry `hasResource: false`, so the availability model never treats
 * a DaraTech title as playable.
 *
 * DaraTech uses the same underlying numeric MovieBox resource ids
 * (base64-encoded as `<id>::pica`), so subject ids translate
 * deterministically — no guessing. Only documented endpoints are used
 * (search, universal detail, health); playback endpoints are deliberately
 * NOT integrated.
 */
import type { ProviderStatus } from "@zen-stream/contracts";
import type { UpstreamFetch, MediaSearchUpstreamParams } from "../../media/client.js";
import { UpstreamHttpError } from "../../media/client.js";
import type { SecondaryMetadataProvider } from "../types.js";
import type { DaratechConfig } from "./config.js";
import { createDaratechClient } from "./client.js";
import { daratechDetailToInfo, daratechSearchToResponse } from "./adapter.js";
import {
  daratechIdFromMovieBox,
  isDaratechId,
  isMovieBoxId,
  movieBoxIdFromDaratech,
  staticIdentityForSubject,
} from "../identity.js";
import type { ResolvedIdentity } from "../identity.js";

export const DARATECH_PROVIDER_ID = "daratech";

export function createDaratechProvider(
  config: DaratechConfig,
  fetchImpl: UpstreamFetch = fetch,
): SecondaryMetadataProvider {
  const client = createDaratechClient(config, fetchImpl);

  function resolveIdentity(subjectId: string): { daratechId: string; identity: ResolvedIdentity } {
    if (isDaratechId(subjectId)) {
      return { daratechId: subjectId, identity: staticIdentityForSubject(subjectId) };
    }
    if (isMovieBoxId(subjectId)) {
      return {
        daratechId: daratechIdFromMovieBox(subjectId),
        identity: staticIdentityForSubject(subjectId),
      };
    }
    throw new UpstreamHttpError(404, `Unknown DaraTech subject id: ${subjectId}`);
  }

  return {
    id: DARATECH_PROVIDER_ID,
    name: "DaraTech",

    async fetchSearch(params: MediaSearchUpstreamParams) {
      const page = await client.search({ keyword: params.keyword, page: params.page });
      return daratechSearchToResponse(params, page);
    },

    async fetchInfo(subjectId: string) {
      const { daratechId, identity } = resolveIdentity(subjectId);
      const identityWithDaratech: ResolvedIdentity = {
        ...identity,
        daratech: daratechId,
        moviebox: identity.moviebox ?? movieBoxIdFromDaratech(daratechId),
      };
      return daratechDetailToInfo(subjectId, await client.detail(daratechId), identityWithDaratech);
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