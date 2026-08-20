import type { MediaProvider, PlaybackProvider, SecondaryMetadataProvider } from "./types.js";

/**
 * Holds the configured media providers by id. The first registered provider
 * of each role is the default for that role; named lookups allow multiple
 * providers to coexist without the routes caring which one is active.
 *
 * Roles are independent:
 *  - metadata:  primary catalog/discovery (e.g. MovieBox)
 *  - secondary: metadata enrichment/fallback only (e.g. TMDB) — never playback
 *  - playback:  stream resolution
 */
export class ProviderRegistry {
  private readonly metadata = new Map<string, MediaProvider>();
  private readonly secondary = new Map<string, SecondaryMetadataProvider>();
  private readonly playback = new Map<string, PlaybackProvider>();
  private defaultMetadataId: string | null = null;
  private defaultSecondaryId: string | null = null;
  private defaultPlaybackId: string | null = null;

  registerMetadata(provider: MediaProvider): this {
    if (!this.metadata.has(provider.id)) {
      this.defaultMetadataId ??= provider.id;
    }
    this.metadata.set(provider.id, provider);
    return this;
  }

  registerPlayback(provider: PlaybackProvider): this {
    if (!this.playback.has(provider.id)) {
      this.defaultPlaybackId ??= provider.id;
    }
    this.playback.set(provider.id, provider);
    return this;
  }

  /** Registers a secondary (metadata-only) provider. */
  registerSecondary(provider: SecondaryMetadataProvider): this {
    if (!this.secondary.has(provider.id)) {
      this.defaultSecondaryId ??= provider.id;
    }
    this.secondary.set(provider.id, provider);
    return this;
  }

  /** Registers a combined provider for both roles. */
  register(provider: MediaProvider & PlaybackProvider): this {
    return this.registerMetadata(provider).registerPlayback(provider);
  }

  hasMetadata(): boolean {
    return this.metadata.size > 0;
  }

  hasSecondary(): boolean {
    return this.secondary.size > 0;
  }

  hasPlayback(): boolean {
    return this.playback.size > 0;
  }

  /** The default metadata provider, or a named one. Null when unregistered. */
  getMetadata(id?: string): MediaProvider | null {
    if (id !== undefined) return this.metadata.get(id) ?? null;
    return this.defaultMetadataId !== null ? (this.metadata.get(this.defaultMetadataId) ?? null) : null;
  }

  /** The default secondary metadata provider, or a named one. Null when unregistered. */
  getSecondary(id?: string): SecondaryMetadataProvider | null {
    if (id !== undefined) return this.secondary.get(id) ?? null;
    return this.defaultSecondaryId !== null ? (this.secondary.get(this.defaultSecondaryId) ?? null) : null;
  }

  /** The default playback provider, or a named one. Null when unregistered. */
  getPlayback(id?: string): PlaybackProvider | null {
    if (id !== undefined) return this.playback.get(id) ?? null;
    return this.defaultPlaybackId !== null ? (this.playback.get(this.defaultPlaybackId) ?? null) : null;
  }
}