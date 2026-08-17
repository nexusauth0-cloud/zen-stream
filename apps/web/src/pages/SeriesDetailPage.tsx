import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMediaInfo, useSeason } from "../api/hooks";
import { DetailsHero } from "../components/media/DetailsHero";
import { RelatedRail } from "../components/media/RelatedRail";
import { EmptyState, ErrorState } from "../components/feedback/States";
import { SkeletonGrid } from "../components/feedback/LoadingSkeleton";
import { ZenIcon } from "../components/Icon/icons";
import "./SeriesDetailPage.css";

export function SeriesDetailPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const info = useMediaInfo(subjectId);
  const seasons = useSeason(subjectId);
  const [activeSeason, setActiveSeason] = useState(1);

  const seasonList = useMemo(() => {
    const list = seasons.data?.seasons ?? [];
    return list.length > 0 ? list : [{ season: 1, totalEpisode: 0, episodesAvailable: 0, resolutions: [], episodes: [] }];
  }, [seasons.data]);

  const current = seasonList.find((season) => season.season === activeSeason) ?? seasonList[0];

  if (info.status === "loading") {
    return (
      <section className="zs-series-details" aria-label="Loading series details">
        <div className="zs-series-details__hero-skeleton" />
        <SkeletonGrid label="Loading series details" count={6} />
      </section>
    );
  }

  if (info.status === "error") {
    return (
      <section className="zs-series-details">
        <ErrorState
          title="This series is unavailable right now"
          message={info.error ?? undefined}
          onRetry={info.retry}
        />
      </section>
    );
  }

  if (!info.data) {
    return (
      <section className="zs-series-details">
        <EmptyState title="Series not found" message="This title is not in the catalog." />
      </section>
    );
  }

  return (
    <section className="zs-series-details" aria-labelledby="zs-series-details-title">
      <DetailsHero info={info.data} />
      <div className="zs-series-details__content">
        <aside className="zs-series-details__poster">
          {info.data.poster ? (
            <img className="zs-series-details__poster-image" src={info.data.poster} alt="" />
          ) : (
            <div className="zs-series-details__poster-fallback">
              <ZenIcon name="film" size={48} />
            </div>
          )}
        </aside>
        <div className="zs-series-details__about">
          <h2 id="zs-series-details-title" className="zs-series-details__heading">
            About {info.data.title}
          </h2>
          <p className="zs-series-details__description">
            {info.data.description ?? "No description available for this title yet."}
          </p>
          {info.data.staff.length > 0 && (
            <ul className="zs-series-details__staff">
              {info.data.staff.map((member) => (
                <li key={`${member.role}-${member.name}`} className="zs-series-details__staff-member">
                  <span className="zs-series-details__staff-name">{member.name}</span>
                  <span className="zs-series-details__staff-role">{member.role}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <RelatedRail subjectId={info.data.subjectId} kind="series" />

      <section className="zs-series-details__episodes" aria-labelledby="zs-series-episodes-title">
        <div className="zs-series-details__episodes-head">
          <h2 id="zs-series-episodes-title" className="zs-series-details__heading">
            Episodes
          </h2>
          {seasons.status === "error" && (
            <p className="zs-series-details__episodes-error">{seasons.error}</p>
          )}
        </div>

        {seasons.status === "loading" && <SkeletonGrid label="Loading episodes" count={6} />}

        {seasons.status === "success" && seasonList.length > 0 && (
          <>
            <div className="zs-season-tabs" role="tablist" aria-label="Seasons">
              {seasonList.map((season) => (
                <button
                  key={season.season}
                  type="button"
                  role="tab"
                  aria-selected={season.season === current?.season}
                  className={`zs-season-tabs__tab${season.season === current?.season ? " zs-season-tabs__tab--active" : ""}`}
                  onClick={() => setActiveSeason(season.season)}
                >
                  Season {season.season}
                </button>
              ))}
            </div>

            <div
              role="tabpanel"
              aria-label={`Season ${current?.season} episodes`}
              className="zs-episode-list"
            >
              {current && current.episodes.length > 0 ? (
                current.episodes.map((episode) => (
                  <Link
                    key={episode.episode}
                    to={`/watch/${info.data?.subjectId}?se=${current.season}&ep=${episode.episode}`}
                    className="zs-episode"
                  >
                    <span className="zs-episode__number">{episode.episode}</span>
                    <span className="zs-episode__body">
                      <span className="zs-episode__title">
                        {episode.title ?? `Episode ${episode.episode}`}
                      </span>
                      {episode.releaseDate && (
                        <span className="zs-episode__date">{episode.releaseDate}</span>
                      )}
                    </span>
                    <ZenIcon name="play" size={16} className="zs-episode__play" />
                  </Link>
                ))
              ) : (
                <EmptyState
                  title="No episodes available yet"
                  message="Episodes for this season are not available to stream yet."
                />
              )}
            </div>
          </>
        )}
      </section>
    </section>
  );
}