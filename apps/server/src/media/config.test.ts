import { afterEach, describe, expect, it } from "vitest";
import { isMediaApiConfigured, mediaApiConfig } from "./config.js";

describe("mediaApiConfig", () => {
  afterEach(() => {
    delete process.env.MEDIA_API_BASE_URL;
    delete process.env.MEDIA_API_SECRET;
  });

  it("returns null when the environment is missing", () => {
    expect(mediaApiConfig()).toBeNull();
    expect(isMediaApiConfigured()).toBe(false);
  });

  it("reads credentials from the server environment", () => {
    process.env.MEDIA_API_BASE_URL = "https://media.example/";
    process.env.MEDIA_API_SECRET = "hunter2";

    expect(mediaApiConfig()).toEqual({
      baseUrl: "https://media.example",
      secret: "hunter2",
    });
    expect(isMediaApiConfigured()).toBe(true);
  });

  it("returns null when only the base url is set", () => {
    process.env.MEDIA_API_BASE_URL = "https://media.example";

    expect(mediaApiConfig()).toBeNull();
  });
});