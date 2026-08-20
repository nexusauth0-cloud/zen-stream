import { useParams } from "react-router-dom";
import { useMediaInfo } from "../api/hooks";
import { infoWithCachedReleaseDate, knownUpcoming } from "../api/subjectCache";
import { ComingSoonDetails } from "../components/media/ComingSoonDetails";
import { DetailsHero } from "../components/media/DetailsHero";
import { RelatedRail } from "../components/media/RelatedRail";
import { EmptyState, ErrorState } from "../components/feedback/States";
import { SkeletonGrid } from "../components/feedback/LoadingSkeleton";
import { ZenIcon } from "../components/Icon/icons";
import "./DetailsPage.css";

export function MoviePage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { status, data, error, retry } = useMediaInfo(subjectId);
  const info = data ? infoWithCachedReleaseDate(data) : null;

  if (status === "loading") {
    return (
      <section className="zs-details" aria-label="Loading movie details">
        <div className="zs-details__hero-skeleton" />
        <SkeletonGrid label="Loading movie details" count={6} />
      </section>
    );
  }

  if (status === "error") {
    const upcoming = knownUpcoming(subjectId ?? "");
    if (upcoming) {
      return (
        <section className="zs-details">
          <ComingSoonDetails item={upcoming} />
        </section>
      );
    }
    return (
      <section className="zs-details">
        <ErrorState
          title="This movie is unavailable right now"
          message={error ?? undefined}
          onRetry={retry}
        />
      </section>
    );
  }

  if (!info) {
    return (
      <section className="zs-details">
        <EmptyState title="Movie not found" message="This title is not in the catalog." />
      </section>
    );
  }

  return (
    <section className="zs-details" aria-labelledby="zs-details-title">
      <DetailsHero info={info} />
      <div className="zs-details__content">
        <aside className="zs-details__poster">
          {info.poster ? (
            <img className="zs-details__poster-image" src={info.poster} alt="" />
          ) : (
            <div className="zs-details__poster-fallback">
              <ZenIcon name="film" size={48} />
            </div>
          )}
        </aside>
        <div className="zs-details__about">
          <h2 id="zs-details-title" className="zs-details__heading">
            About {info.title}
          </h2>
          <p className="zs-details__description">
            {info.description ?? "No description available for this title yet."}
          </p>
          {info.staff.length > 0 && (
            <ul className="zs-details__staff">
              {info.staff.map((member, index) => (
                <li key={`${index}-${member.role}-${member.name}`} className="zs-details__staff-member">
                  <span className="zs-details__staff-name">{member.name}</span>
                  <span className="zs-details__staff-role">{member.role}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <RelatedRail subjectId={info.subjectId} kind="movie" />
    </section>
  );
}