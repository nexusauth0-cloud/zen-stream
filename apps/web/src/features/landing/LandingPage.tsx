import { FeedSections } from "./FeedSections";
import { HomeHero } from "./HomeHero";
import { ProductPreview } from "./ProductPreview";
import { LandingFooter } from "./LandingFooter";
import { HOME_FEED } from "./fixtures";
import "./LandingPage.css";

/**
 * Zen-Stream streaming homepage: cinematic hero, then the composed feed
 * (trending, popular, continue-watching, genres, new releases), the product
 * preview as a secondary surface near the bottom, and a compact footer.
 *
 * Everything is driven by HOME_FEED fixtures — a future backend replaces
 * the fixtures, not the UI.
 */
export function LandingPage() {
  return (
    <div className="zs-landing">
      <HomeHero item={HOME_FEED.hero} />
      <FeedSections sections={HOME_FEED.sections} />
      <ProductPreview />
      <LandingFooter />
    </div>
  );
}