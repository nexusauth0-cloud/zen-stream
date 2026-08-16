import "./PlaceholderPage.css";

export interface PlaceholderPageProps {
  title: string;
  description: string;
  /** Route context shown as supporting microcopy. */
  route?: string;
}

/**
 * Reusable structural placeholder for routes whose feature work lands in a
 * later milestone. Purpose: routing verification — no fake product content.
 */
export function PlaceholderPage({ title, description, route }: PlaceholderPageProps) {
  return (
    <section className="zs-placeholder" data-testid="placeholder-page">
      <h1 className="zs-placeholder__title">{title}</h1>
      <p className="zs-placeholder__description">{description}</p>
      {route ? (
        <p className="zs-placeholder__route" data-testid="placeholder-route">
          {route}
        </p>
      ) : null}
    </section>
  );
}