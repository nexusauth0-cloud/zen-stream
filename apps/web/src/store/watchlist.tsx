import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { MediaSubjectSummary } from "@zen-stream/contracts";

export const WATCHLIST_STORAGE_KEY = "zen-stream.watchlist.v1";

export type WatchlistItem = MediaSubjectSummary;

interface WatchlistContextValue {
  items: WatchlistItem[];
  isSaved: (subjectId: string) => boolean;
  toggle: (item: WatchlistItem) => void;
  remove: (subjectId: string) => void;
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

/** Reads persisted watchlist entries; never throws. */
function readStoredItems(): WatchlistItem[] {
  try {
    const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as WatchlistItem[]) : [];
  } catch {
    return [];
  }
}

/**
 * Watchlist state, persisted to localStorage. The stored snapshot captures
 * the card metadata at save time so "My List" renders offline without
 * refetching; cards always show the live catalog title.
 */
export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WatchlistItem[]>(readStoredItems);

  useEffect(() => {
    try {
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage unavailable (private mode / disabled) — in-memory state stays.
    }
  }, [items]);

  const isSaved = useCallback(
    (subjectId: string) => items.some((item) => item.subjectId === subjectId),
    [items],
  );

  const toggle = useCallback((item: WatchlistItem) => {
    setItems((current) => {
      const exists = current.some((entry) => entry.subjectId === item.subjectId);
      return exists
        ? current.filter((entry) => entry.subjectId !== item.subjectId)
        : [item, ...current];
    });
  }, []);

  const remove = useCallback((subjectId: string) => {
    setItems((current) => current.filter((entry) => entry.subjectId !== subjectId));
  }, []);

  const value = useMemo(
    () => ({ items, isSaved, toggle, remove }),
    [items, isSaved, toggle, remove],
  );

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}

export function useWatchlist(): WatchlistContextValue {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error("useWatchlist must be used within a WatchlistProvider.");
  }
  return context;
}