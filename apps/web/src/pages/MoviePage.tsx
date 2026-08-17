import { useParams } from "react-router-dom";
import { useMediaInfo } from "../api/hooks";
import { DetailsHero } from "../components/media/DetailsHero";
import { RelatedRail } from "../components/media/RelatedRail";
import { EmptyState, ErrorState } from "../components/feedback/States";
import { SkeletonGrid } from "../components/feedback/LoadingSkeleton";
import { ZenIcon } from "../components/Icon/icons";
import "./DetailsPage.css";

export function MoviePage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { status, data, error, retry } = useMediaInfo(subjectId);

  if (status === "loading") {
    return (
      <section className="zs-details" aria-label="Loading movie details">
        <div className="zs-details__hero-skeleton" />
        <SkeletonGrid label="Loading movie details" count={6} />
      </section>
    );
  }

  if (status === "error") {
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

  if (!data) {
    return (
      <section className="zs-details">
        <EmptyState title="Movie not found" message="This title is not in the catalog." />
      </section>
    );
  }

  return (
    <section className="zs-details" aria-labelledby="zs-details-title">
      <DetailsHero info={data} />
      <div className="zs-details__content">
        <aside className="zs-details__poster">
          {data.poster ? (
            <img className="zs-details__poster-image" src={data.poster} alt="" />
          ) : (
            <div className="zs-details__poster-fallback">
              <ZenIcon name="film" size={48} />
            </div>
          )}
        </aside>
        <div className="zs-details__about">
          <h2 id="zs-details-title" className="zs-details__heading">
            About {data.title}
          </h2>
          <p className="zs-details__description">
            {data.description ?? "No description available for this title yet."}
          </p>
          {data.staff.length > 0 && (
            <ul className="zs-details__staff">
              {data.staff.map((member) => (
                <li key={`${member.role}-${member.name}`} className="zs-details__staff-member">
                  <span className="zs-details__staff-name">{member.name}</span>
                  <span className="zs-details__staff-role">{member.role}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <RelatedRail subjectId={data.subjectId} kind="movie" />
    </section>
  );
}