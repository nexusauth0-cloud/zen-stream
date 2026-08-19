/**
 * Zen-Stream provider abstraction.
 *
 * The server fetches catalog + playback data through *providers* rather
 * than a hard-wired transport. A provider implements the {@link MediaProvider}
 * (metadata/search) surface, and optionally the separate
 * {@link PlaybackProvider} (streams) surface — playback is deliberately a
 * different concern so it can be swapped independently.
 *
 * All provider methods return the canonical Zen-Stream contract payloads
 * (already normalized by the contracts package); providers never leak
 * upstream shapes or credentials.
 */
import type {
  MediaHomeFeed,
  MediaHomeRows,
  MediaHomeSubjects,
  MediaInfo,
  MediaSearchResponse,
  MediaSeasonResponse,
  MediaStreamResponse,
} from "@zen-stream/contracts";
import type { MediaSearchUpstreamParams, MediaStreamUpstreamParams } from "../media/client.js";

/** Catalog/metadata surface — everything except playback. */
export interface MediaProvider {
  readonly id: string;
  readonly name: string;
  fetchHome(): Promise<MediaHomeFeed>;
  fetchHomeRows(): Promise<MediaHomeRows>;
  fetchHomeSubjects(opId: string): Promise<MediaHomeSubjects>;
  fetchSearch(params: MediaSearchUpstreamParams): Promise<MediaSearchResponse>;
  fetchInfo(subjectId: string): Promise<MediaInfo>;
  fetchSeason(subjectId: string): Promise<MediaSeasonResponse>;
}

/** Playback surface — stream resolution for a subject. */
export interface PlaybackProvider {
  readonly id: string;
  readonly name: string;
  fetchStream(subjectId: string, params: MediaStreamUpstreamParams): Promise<MediaStreamResponse>;
}

/** A provider that can serve both roles. */
export type CombinedProvider = MediaProvider & PlaybackProvider;