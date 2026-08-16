import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { MediaSearchItem, MediaSubjectSummary } from "@zen-stream/contracts";
import { useSearch } from "../api/hooks";
import { EmptyState, ErrorState } from "../components/feedback/States";
import { SkeletonGrid } from "../components/feedback/LoadingSkeleton";
import { MediaCard } from "../components/media/MediaCard";
import { MediaGrid } from "../components/media/MediaGrid";
import { ZenIcon } from "../components/Icon/icons";
import "./SearchPage.css";

function asSummary(item: MediaSearchItem): MediaSubjectSummary {
  return {
    subjectId: item.subjectId,
    type: item.type,
    title: item.title,
    poster: item.poster,
    hasResource: false,
    description: null,
    releaseDate: item.releaseDate,
    runtime: null,
    genre: item.genre,
    rating: item.rating,
    language: item.language,
    country: item.country,
  };
}

const DEBOUNCE_MS = 300;

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [input, setInput] = useState(urlQuery);
  const [query, setQuery] = useState(urlQuery);
  const [pages, setPages] = useState(1);
  const [accumulated, setAccumulated] = useState<MediaSearchItem[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setInput(urlQuery);
    setQuery(urlQuery);
    setPages(1);
  }, [urlQuery]);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const trimmed = input.trim();
      if (trimmed === query) return;
      setQuery(trimmed);
      setPages(1);
      if (trimmed) {
        setSearchParams({ q: trimmed }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    }, DEBOUNCE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [input, query, setSearchParams]);

  const enabled = query.length > 0;
  const { status, data, error, retry } = useSearch({ keyword: query, page: pages });

  useEffect(() => {
    if (status === "success" && data) {
      if (pages === 1) setAccumulated(data.items);
      else setAccumulated((current) => [...current, ...data.items]);
    }
  }, [status, data, pages]);

  const hasMore = useMemo(() => data?.pager.hasMore ?? false, [data]);
  const totalCount = data?.pager.totalCount ?? accumulated.length;

  const handleLoadMore = () => setPages((value) => value + 1);

  return (
    <section className="zs-search">
      <header className="zs-search__head">
        <h1 className="zs-search__title">Search</h1>
      </header>

      <div className="zs-search__field">
        <ZenIcon name="search" className="zs-search__icon" aria-hidden="true" />
        <input
          type="search"
          className="zs-search__input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Movies, TV shows, and more"
          aria-label="Search the catalog"
          autoFocus
        />
      </div>

      {!enabled && (
        <p className="zs-search__hint">Type a title to search the catalog.</p>
      )}

      {enabled && status === "loading" && <SkeletonGrid label={`Searching for ${query}`} />}

      {enabled && status === "error" && (
        <ErrorState title="Search is unavailable right now" message={error ?? undefined} onRetry={retry} />
      )}

      {enabled && status === "success" && accumulated.length === 0 && (
        <EmptyState
          title={`No results for “${query}”`}
          message="Try a different spelling or a broader term."
        />
      )}

      {enabled && status === "success" && accumulated.length > 0 && (
        <>
          <p className="zs-search__count">
            {totalCount} {totalCount === 1 ? "result" : "results"} for “{query}”
          </p>
          <MediaGrid>
            {accumulated.map((item) => (
              <MediaCard key={item.subjectId} item={asSummary(item)} />
            ))}
          </MediaGrid>
          {hasMore && (
            <div className="zs-search__more">
              <button type="button" className="zs-button zs-button--secondary" onClick={handleLoadMore}>
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}