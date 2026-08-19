import { useCallback, useEffect, useRef, useState } from "react";
import { ZenIcon } from "../Icon/icons";
import { canShare, realShareCapabilities, shareMedia } from "../../media/share";
import type { ShareCapabilities } from "../../media/share";
import "./ShareButton.css";

export interface ShareButtonProps {
  /** Canonical details URL to share — never a playback URL. */
  url: string;
  /** Title shared via the Web Share API and used for the accessible name. */
  title?: string;
  label?: string;
  size?: "md" | "lg";
  className?: string;
  /** Test seam. */
  capabilities?: ShareCapabilities | null;
}

/**
 * Shares a title's details page: native share sheet when available,
 * clipboard copy otherwise ("Link copied" feedback). Hidden entirely when
 * the browser supports neither path. Only canonical details URLs are
 * shared.
 */
export function ShareButton({
  url,
  title,
  label = "Share",
  size = "md",
  className,
  capabilities: capabilitiesProp,
}: ShareButtonProps) {
  const [capabilities] = useState<ShareCapabilities | null>(
    () => capabilitiesProp !== undefined ? capabilitiesProp : realShareCapabilities(),
  );
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
  }, []);

  const handleClick = useCallback(() => {
    if (!capabilities) return;
    void shareMedia({ url, title }, capabilities).then((result) => {
      if (result !== "copied") return;
      setCopied(true);
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2500);
    });
  }, [capabilities, url, title]);

  if (!canShare(capabilities)) return null;

  return (
    <button
      type="button"
      className={[
        "zs-share-button",
        `zs-share-button--${size}`,
        copied ? "zs-share-button--copied" : undefined,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={copied ? "Link copied" : `Share ${title ?? label}`}
      onClick={handleClick}
    >
      <ZenIcon name={copied ? "check" : "share"} size={size === "lg" ? 18 : 16} />
      {copied ? "Link copied" : label}
    </button>
  );
}