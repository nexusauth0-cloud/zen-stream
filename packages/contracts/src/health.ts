import { z } from "zod";

export const healthResponseSchema = z
  .object({
    status: z.literal("ok"),
  })
  .strict();

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export function isHealthResponse(value: unknown): value is HealthResponse {
  return healthResponseSchema.safeParse(value).success;
}