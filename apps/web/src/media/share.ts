/**
 * Share support: Web Share API when the browser offers it, clipboard copy
 * as the universal fallback, and a legacy execCommand copy as the last
 * resort. Returns what actually happened so callers can give honest
 * feedback ("Link copied") or hide the action entirely ("unsupported").
 */

export type ShareResult = "shared" | "copied" | "cancelled" | "unsupported";

export interface SharePayload {
  url: string;
  title?: string;
}

export interface ShareCapabilities {
  share?: (data: SharePayload) => Promise<void>;
  clipboard?: { writeText(text: string): Promise<void> };
  /** Legacy fallback; injected for tests. */
  fallbackCopy?: (text: string) => boolean;
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: unknown }).name === "AbortError"
  );
}

export function shareMedia(
  payload: SharePayload,
  capabilities: ShareCapabilities,
): Promise<ShareResult> {
  if (capabilities.share) {
    return capabilities
      .share({ title: payload.title, url: payload.url })
      .then(() => "shared" as const)
      .catch((error: unknown) => {
        if (isAbortError(error)) return "cancelled" as const;
        return copyFallback(payload, capabilities);
      });
  }
  return Promise.resolve(copyFallback(payload, capabilities));
}

async function copyFallback(payload: SharePayload, capabilities: ShareCapabilities): Promise<ShareResult> {
  if (capabilities.clipboard) {
    try {
      await capabilities.clipboard.writeText(payload.url);
      return "copied";
    } catch {
      // Clipboard API can reject (permissions, focus) — try the legacy path.
    }
  }
  if (capabilities.fallbackCopy?.(payload.url)) return "copied";
  return "unsupported";
}

function legacyCopy(text: string): boolean {
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    textarea.remove();
    return ok;
  } catch {
    return false;
  }
}

/** Detects what the current browser can do (may be nothing — then hide Share). */
export function realShareCapabilities(): ShareCapabilities | null {
  if (typeof navigator === "undefined") return null;
  return {
    share: typeof navigator.share === "function" ? navigator.share.bind(navigator) : undefined,
    clipboard:
      navigator.clipboard && typeof navigator.clipboard.writeText === "function"
        ? { writeText: (text: string) => navigator.clipboard.writeText(text) }
        : undefined,
    fallbackCopy:
      typeof document !== "undefined" && typeof document.execCommand === "function"
        ? (text: string) => legacyCopy(text)
        : undefined,
  };
}

/** Whether any sharing path exists at all (used to hide the action). */
export function canShare(capabilities: ShareCapabilities | null): boolean {
  return (
    capabilities !== null &&
    (capabilities.share !== undefined ||
      capabilities.clipboard !== undefined ||
      capabilities.fallbackCopy !== undefined)
  );
}