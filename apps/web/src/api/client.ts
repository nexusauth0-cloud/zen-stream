/**
 * Zen-Stream web API client.
 *
 * All catalog traffic flows through the server-side media proxy
 * (`/api/v1/media/*`) — the browser never talks to the upstream media
 * worker and never holds its credentials.
 */

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

export class MediaApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "MediaApiError";
    this.status = status;
    this.code = code;
  }
}

const NETWORK_ERROR = new MediaApiError(0, "NETWORK_ERROR", "Could not reach the Zen-Stream server.");

/**
 * Fetches JSON from the Zen-Stream server API and normalizes failures into
 * a typed MediaApiError. Aborted requests rethrow the DOMException so
 * callers can distinguish cancellation from genuine failures.
 */
export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw NETWORK_ERROR;
  }

  if (!response.ok) {
    let body: ApiErrorBody | null = null;
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      // Non-JSON error bodies still map to a typed failure below.
    }
    throw new MediaApiError(
      response.status,
      body?.error?.code ?? "HTTP_ERROR",
      body?.error?.message ?? `The server responded with ${response.status}.`,
    );
  }

  return (await response.json()) as T;
}