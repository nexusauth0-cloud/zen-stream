import { useCallback, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import type { MediaSubjectSummary } from "@zen-stream/contracts";
import { formatMediaReleaseDate, getMediaAvailability } from "@zen-stream/contracts";
import { useMediaInfo, useStream } from "../api/hooks";
import { infoWithCachedReleaseDate, knownUpcoming, summaryFromInfo } from "../api/subjectCache";
import { ButtonLink } from "../components/ButtonLink/ButtonLink";
import { ErrorState } from "../components/feedback/States";
import { ZenIcon } from "../components/Icon/icons";
import { WatchlistButton } from "../components/media/WatchlistButton";
import "./WatchPage.css";

type PlayerStatus = "loading" | "ready" | "playing" | "paused" | "unavailable" | "error";

export function WatchPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const [searchParams] = useSearchParams();
  const se = Number(searchParams.get("se") ?? 0);
  const ep = Number(searchParams.get("ep") ?? 0);

  const infoState = useMediaInfo(subjectId);

  // Honest availability guard: upcoming or non-playable titles never reach
  // the player. When the info fetch itself fails, the guard falls back to
  // session-cached metadata so a known-upcoming title still never invokes
  // playback — an upstream blip must never block genuinely playable titles.
  const guard = useMemo(() => {
    if (infoState.status === "success" && infoState.data) {
      const info = infoWithCachedReleaseDate(infoState.data);
      const availability = getMediaAvailability({
        releaseDate: info.releaseDate,
        hasResource: info.hasResource,
      });
      if (availability === "available") return null;
      return availability === "coming-soon" ? "coming-soon" : "unavailable";
    }
    if (infoState.status === "error" && knownUpcoming(subjectId ?? "")) {
      return "coming-soon";
    }
    return null;
  }, [infoState, subjectId]);

  const guardBlocks = guard === "coming-soon" || guard === "unavailable";
  const { status, data, error, retry } = useStream({ subjectId, se, ep }, !guardBlocks);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>("loading");

  const stream = useMemo(() => data?.streams[0] ?? null, [data]);

  const handlePlay = useCallback(() => setPlayerStatus("playing"), []);
  const handlePause = useCallback(() => setPlayerStatus("paused"), []);
  const handleError = useCallback(() => setPlayerStatus("error"), []);
  const handleCanPlay = useCallback(() => {
    if (playerStatus === "loading") setPlayerStatus("ready");
  }, [playerStatus]);

  if (guard === "coming-soon") {
    const upcoming = infoState.data
      ? summaryFromInfo(infoWithCachedReleaseDate(infoState.data))
      : knownUpcoming(subjectId ?? "");
    return upcoming ? <ComingSoonGuard item={upcoming} /> : null;
  }

  if (guard === "unavailable") {
    return <UnavailableGuard retry={infoState.retry} />;
  }

  if (status === "loading") {
    return (
      <section className="zs-player" aria-label="Loading player">
        <div className="zs-player__frame">
          <div className="zs-player__loading" role="status" aria-label="Loading stream">
            <span className="zs-player__spinner" aria-hidden="true" />
            <span>Finding a stream for you…</span>
          </div>
        </div>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className="zs-player">
        <div className="zs-player__frame">
          <ErrorState
            title="This title is unavailable right now"
            message={error ?? undefined}
            onRetry={retry}
          />
        </div>
      </section>
    );
  }

  if (!stream) {
    return (
      <section className="zs-player">
        <div className="zs-player__frame">
          <div className="zs-player__message" role="status">
            <ZenIcon name="alert" size={32} />
            <h1 className="zs-player__message-title">Nothing to play yet</h1>
            <p className="zs-player__message-text">
              {se > 0 || ep > 0
                ? "This episode is not available to stream right now."
                : "This title is not available to stream right now."}
            </p>
            <Link className="zs-player__back" to={`/movie/${subjectId}`}>
              Back to details
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="zs-player" aria-label="Player">
      <div className="zs-player__frame">
        {playerStatus === "error" ? (
          <div className="zs-player__message" role="alert">
            <ZenIcon name="alert" size={32} />
            <h1 className="zs-player__message-title">Playback failed</h1>
            <p className="zs-player__message-text">
              The stream could not be played. Try again or pick another title.
            </p>
            <button
              type="button"
              className="zs-player__retry"
              onClick={() => {
                // Stream URLs are short-lived signed links; retrying must
                // fetch a fresh stream rather than reload the expired one.
                setPlayerStatus("loading");
                retry();
              }}
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="zs-player__video"
              src={stream.url}
              controls
              preload="metadata"
              aria-label={`${stream.quality} stream`}
              onPlay={handlePlay}
              onPause={handlePause}
              onError={handleError}
              onCanPlay={handleCanPlay}
            />
            <div className="zs-player__status" role="status">
              <span className="zs-player__status-dot" aria-hidden="true" />
              {playerStatus === "loading" && "Loading…"}
              {playerStatus === "ready" && "Ready to play"}
              {playerStatus === "playing" && "Playing"}
              {playerStatus === "paused" && "Paused"}
            </div>
          </>
        )}
      </div>

      <div className="zs-player__details">
        <h1 className="zs-player__title">
          {se > 0 || ep > 0 ? `Season ${se} · Episode ${ep}` : "Now playing"}
        </h1>
        {stream.quality && (
          <p className="zs-player__quality">
            {stream.quality}
            {stream.resolution > 0 ? ` (${stream.resolution}p)` : ""}
            {stream.duration ? ` · ${Math.round(stream.duration / 60)} min` : ""}
          </p>
        )}
        <div className="zs-player__back-row">
          <ButtonLink to={`/series/${subjectId}`} variant="secondary" size="sm">
            Back to details
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

function ComingSoonGuard({ item }: { item: MediaSubjectSummary }) {
  const detailUrl = item.type === "movie" ? `/movie/${item.subjectId}` : `/series/${item.subjectId}`;
  const date = formatMediaReleaseDate(item.releaseDate, { year: true });
  return (
    <section className="zs-player" aria-label="Coming soon">
      <div className="zs-player__frame">
        <div className="zs-player__message" role="status">
          <ZenIcon name="calendar" size={32} />
          <h1 className="zs-player__message-title">Coming Soon</h1>
          <p className="zs-player__message-text">
            {date ? `Available ${date}` : `${item.title} is not available to stream yet.`}
          </p>
          <div className="zs-player__guard-actions">
            <WatchlistButton item={item} label="Save" savedLabel="Saved" />
            <ButtonLink to={detailUrl} variant="secondary" size="sm">
              Back to details
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}

function UnavailableGuard({ retry }: { retry: () => void }) {
  return (
    <section className="zs-player" aria-label="Playback unavailable">
      <div className="zs-player__frame">
        <div className="zs-player__message" role="status">
          <ZenIcon name="alert" size={32} />
          <h1 className="zs-player__message-title">Playback unavailable</h1>
          <p className="zs-player__message-text">This title cannot be streamed right now.</p>
          <div className="zs-player__guard-actions">
            <button type="button" className="zs-button zs-button--primary" onClick={retry}>
              Retry
            </button>
            <Link className="zs-player__back" to="/">
              Back to browse
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}