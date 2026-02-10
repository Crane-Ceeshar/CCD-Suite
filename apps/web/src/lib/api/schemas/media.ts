import { z } from 'zod';

// ── Media Library ──────────────────────────────────────────────────
export const mediaListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  tags: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(',').map((t) => t.trim()).filter(Boolean) : [])),
});

export const mediaUpdateSchema = z.object({
  tags: z.array(z.string()).optional(),
  alt_text: z.string().max(500).nullable().optional(),
  file_name: z.string().max(500).optional(),
});

// ── Content Analytics ──────────────────────────────────────────────
export const contentAnalyticsQuerySchema = z.object({
  period: z.string().default('30d'),
});

// ── Publishing ─────────────────────────────────────────────────────
export const publishRequestSchema = z.object({
  integration_id: z.string().uuid('Integration ID is required'),
  content_item_id: z.string().uuid('Content item ID is required'),
});

// ── Scheduling Queue ───────────────────────────────────────────────
export const schedulingQueueQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const schedulingReorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      publish_date: z.string(),
    })
  ).min(1, 'At least one item is required'),
});
