import { ButtonLink } from "../../components/ButtonLink/ButtonLink";
import { LANDING_COPY } from "./fixtures";
import "./FinalCta.css";

/**
 * Final call to action: strong editorial typography with a restrained
 * amber accent rule. No stats, no pressure copy.
 */
export function FinalCta() {
  return (
    <section className="zs-section zs-final-cta" aria-labelledby="zs-final-title">
      <p className="zs-final-cta__eyebrow">{LANDING_COPY.finalEyebrow}</p>
      <h2 id="zs-final-title" className="zs-final-cta__title">
        {LANDING_COPY.finalTitle}
      </h2>
      <p className="zs-final-cta__support">{LANDING_COPY.finalSupport}</p>
      <div className="zs-final-cta__actions">
        <ButtonLink to="/movies" variant="primary" size="md">
          {LANDING_COPY.primaryCta}
        </ButtonLink>
        <ButtonLink to="/series" variant="secondary" size="md">
          {LANDING_COPY.secondaryCta}
        </ButtonLink>
      </div>
    </section>
  );
}