import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";

const app = createApp();

describe("GET /api/v1/health", () => {
  it("returns an ok status", async () => {
    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
    expect(response.headers["content-type"]).toMatch(/application\/json/);
  });
});

describe("error boundary", () => {
  it("returns a JSON 404 for unknown routes", async () => {
    const response = await request(app).get("/api/v1/does-not-exist");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "The requested resource does not exist.",
      },
    });
  });

  it("returns a JSON error for malformed bodies", async () => {
    const response = await request(app)
      .post("/api/v1/health")
      .set("Content-Type", "application/json")
      .send("{not-json");

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.body).toHaveProperty("error");
  });
});
