import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { MediaSearchItem, MediaSubjectSummary } from "@zen-stream/contracts";
import { useHomeFeed, useSearch } from "../api/hooks";
import { normalizeSearchKeyword } from "../api/media";
import { EmptyState, ErrorState } from "../components/feedback/States";
import { SkeletonGrid, SkeletonRail } from "../components/feedback/LoadingSkeleton";
import { MediaCard } from "../components/media/MediaCard";
import { MediaGrid } from "../components/media/MediaGrid";
import { MediaRail } from "../components/media/MediaRail";
import { SectionHeader } from "../components/media/SectionHeader";
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
      // Case changes are not a new search: the API boundary normalizes the
      // keyword, so "From" and "from" must not trigger redundant fetches.
      if (normalizeSearchKeyword(trimmed) === normalizeSearchKeyword(query)) return;
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
  const suggestions = useHomeFeed();

  useEffect(() => {
    if (status === "success" && data) {
      if (pages === 1) setAccumulated(data.items);
      else setAccumulated((current) => [...current, ...data.items]);
    }
  }, [status, data, pages]);

  const hasMore = useMemo(() => data?.pager?.hasMore ?? false, [data]);
  const totalCount = data?.pager?.totalCount ?? accumulated.length;

  const handleLoadMore = () => setPages((value) => value + 1);

  /** First movie row and first series row of the live feed, for idle browsing. */
  const suggestionRows = useMemo(() => {
    if (!suggestions.data) return [];
    const movieRow = suggestions.data.rows.find((row) => row.type === "SUBJECTS_MOVIE");
    const seriesRow = suggestions.data.rows.find((row) => row.type === "SUBJECTS_TV");
    return [
      movieRow ? { title: "Popular movies", row: movieRow } : null,
      seriesRow ? { title: "Popular series", row: seriesRow } : null,
    ].filter((entry): entry is { title: string; row: (typeof movieRow) & object } => entry !== null && entry.row !== undefined);
  }, [suggestions.data]);

  return (
    <section className="zs-search">
      <header className="zs-search__head">
        <h1 className="zs-search__title">Search movies and TV shows</h1>
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

      {!enabled && suggestions.status === "loading" && (
        <div className="zs-search__suggestions">
          <SectionHeader title="Popular right now" />
          <SkeletonRail label="Loading popular titles" count={8} />
        </div>
      )}

      {!enabled && suggestions.status === "success" && suggestionRows.length > 0 && (
        <div className="zs-search__suggestions">
          {suggestionRows.map(({ title, row }) => (
            <section key={row.opId} className="zs-search__suggestion" aria-label={title}>
              <SectionHeader title={title} />
              <MediaRail title={title}>
                {row.subjects.slice(0, 12).map((subject) => (
                  <MediaCard key={subject.subjectId} item={subject} className="zs-media-rail__card" />
                ))}
              </MediaRail>
            </section>
          ))}
        </div>
      )}

      {!enabled && suggestions.status === "success" && suggestionRows.length === 0 && (
        <p className="zs-search__hint">Type a title to search the catalog.</p>
      )}

      {!enabled && suggestions.status === "error" && (
        <p className="zs-search__hint">
          Type a title to search the catalog. Popular picks are unavailable right now.
        </p>
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
          <div className="zs-search__results-head">
            <h2 className="zs-search__results-title">Results for “{query}”</h2>
            <p className="zs-search__count">
              {totalCount} {totalCount === 1 ? "result" : "results"}
            </p>
          </div>
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