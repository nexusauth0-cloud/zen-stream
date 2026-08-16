import express from "express";
import { healthResponseSchema } from "@zen-stream/contracts";
import { errorHandler, notFoundHandler } from "./errors.js";

export function createApp(): express.Express {
  const app = express();

  app.use(express.json());

  app.get("/api/v1/health", (_req, res) => {
    const body = healthResponseSchema.parse({ status: "ok" });
    res.json(body);
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
