import { ZenIcon } from "../../components/Icon/icons";
import "./PromoBanner.css";

const PROMO_COPY: readonly { title: string; text: string }[] = [
  {
    title: "Watch everywhere",
    text: "Take movies and series with you on any screen.",
  },
  {
    title: "Stream on the go",
    text: "The Zen-Stream app keeps your watchlist in sync.",
  },
  {
    title: "Never miss a title",
    text: "Get notified when new episodes arrive.",
  },
];

export interface PromoBannerProps {
  /** Picks one of the rotating promo copy blocks. */
  variant?: number;
}

/**
 * Compact download-app placement interleaved between home rails. The CTA
 * is intentionally not a link: there is no legitimate download destination
 * yet, so it stays visually present without pointing anywhere.
 */
export function PromoBanner({ variant = 0 }: PromoBannerProps) {
  const copy = PROMO_COPY[variant % PROMO_COPY.length]!;
  return (
    <aside className="zs-promo" aria-label="Download the Zen-Stream app">
      <span className="zs-promo__icon" aria-hidden="true">
        <ZenIcon name="download" size={22} />
      </span>
      <div className="zs-promo__copy">
        <p className="zs-promo__title">{copy.title}</p>
        <p className="zs-promo__text">{copy.text}</p>
      </div>
      <button type="button" className="zs-promo__cta" aria-disabled="true">
        Coming soon
      </button>
    </aside>
  );
}
