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

/** Provider health statuses — "healthy" / "degraded" / "offline". */
export const providerStatusSchema = z.enum(["healthy", "degraded", "offline"]);
export type ProviderStatus = z.infer<typeof providerStatusSchema>;

/** Lightweight per-provider health report for debugging/observability. */
export const providerHealthResponseSchema = z
  .object({
    providers: z
      .array(
        z.object({
          id: z.string().min(1),
          name: z.string().min(1),
          status: providerStatusSchema,
        }),
      )
      .default([]),
  })
  .strict();

export type ProviderHealthResponse = z.infer<typeof providerHealthResponseSchema>;