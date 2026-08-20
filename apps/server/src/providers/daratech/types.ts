/**
 * DaraTech raw API types + validation schemas.
 *
 * These describe the subset of the DaraTech API Zen-Stream consumes
 * (search, universal detail, health). Raw payloads are validated here
 * before the adapter normalizes them into the canonical Zen-Stream
 * contract shapes. Only documented endpoints are used.
 */
import { z } from "zod";

const nullableNumber = z
  .union([z.number(), z.string().regex(/^-?\d+(\.\d+)?$/)])
  .nullish()
  .transform((value) => (value === null || value === undefined || value === "" ? null : Number(value)));

const nullableString = z
  .string()
  .nullish()
  .transform((value) => value ?? null);

export const daratechSearchItemSchema = z.object({
  id: z.string().min(1),
  subjectId: z.string().min(1),
  title: z.string(),
  cover: nullableString,
  backdrop: nullableString,
  year: nullableNumber,
  rating: nullableNumber,
  genres: z.array(z.string()).default([]),
  description: nullableString,
  category: nullableString,
  subjectType: z.number().nullish(),
  isUgandan: z.boolean().nullish(),
  vjname: nullableString,
  duration: nullableString,
  language: nullableString,
  country: nullableString,
});
export type DaratechSearchItem = z.infer<typeof daratechSearchItemSchema>;

export const daratechSearchResponseSchema = z.object({
  items: z.array(daratechSearchItemSchema).default([]),
});
export type DaratechSearchResponse = z.infer<typeof daratechSearchResponseSchema>;

const daratechCastMemberSchema = z.object({
  name: z.string(),
  role: nullableString,
  photo: nullableString,
});

export const daratechDetailSchema = z.object({
  id: z.string().min(1),
  subjectId: z.string().min(1),
  title: z.string(),
  cover: nullableString,
  backdrop: nullableString,
  year: nullableNumber,
  rating: nullableNumber,
  genres: z.array(z.string()).default([]),
  description: nullableString,
  category: nullableString,
  subjectType: z.number().nullish(),
  isUgandan: z.boolean().nullish(),
  vjname: nullableString,
  duration: nullableString,
  language: nullableString,
  country: nullableString,
  cast: z.array(daratechCastMemberSchema).default([]),
  stills: z.array(z.object({ url: z.string() })).default([]),
  related: z.array(z.unknown()).default([]),
  trailer: nullableString,
});
export type DaratechDetail = z.infer<typeof daratechDetailSchema>;

export const daratechHealthSchema = z.object({
  status: z.string(),
  success: z.boolean().nullish().transform((value) => value ?? false),
});