/**
 * Small TTL cache used for provider-facing data (identity resolutions,
 * metadata enrichment). Failures are never cached — only successful
 * values — so temporary provider errors always pass through and stale
 * availability is avoided.
 */
export interface TtlCache<T> {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
  clear(): void;
}

export function createTtlCache<T>(ttlMs: number, now: () => number = Date.now): TtlCache<T> {
  const store = new Map<string, { at: number; value: T }>();

  return {
    get(key: string): T | undefined {
      const entry = store.get(key);
      if (!entry) return undefined;
      if (now() - entry.at >= ttlMs) {
        store.delete(key);
        return undefined;
      }
      return entry.value;
    },
    set(key: string, value: T): void {
      store.set(key, { at: now(), value });
    },
    clear(): void {
      store.clear();
    },
  };
}