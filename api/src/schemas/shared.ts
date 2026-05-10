import { z } from 'zod';

export const colorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{8}$/, 'Color must be a valid #RRGGBBAA hex color.');

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(24),
  cursor: z.string().min(1).optional(),
});

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(200).optional(),
});

export const searchablePaginationSchema = paginationSchema
  .extend(searchQuerySchema.shape)
  .strict();
