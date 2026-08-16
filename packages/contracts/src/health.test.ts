import { describe, expect, it } from "vitest";
import { healthResponseSchema, isHealthResponse } from "./health";

describe("health contract", () => {
  it("accepts a healthy response", () => {
    expect(healthResponseSchema.parse({ status: "ok" })).toEqual({ status: "ok" });
  });

  it("rejects anything but an ok status", () => {
    expect(healthResponseSchema.safeParse({ status: "degraded" }).success).toBe(false);
    expect(healthResponseSchema.safeParse({ status: 1 }).success).toBe(false);
    expect(healthResponseSchema.safeParse({}).success).toBe(false);
  });

  it("guards unknown values", () => {
    expect(isHealthResponse({ status: "ok" })).toBe(true);
    expect(isHealthResponse({ status: "ok", extra: true })).toBe(false);
    expect(isHealthResponse(null)).toBe(false);
  });
});