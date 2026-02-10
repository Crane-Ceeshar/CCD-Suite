import { z } from 'zod';

export const notificationListQuerySchema = z.object({
  page: z.string().default('1')
    .transform((v) => Math.max(Number(v) || 1, 1)),
  limit: z.string().default('20')
    .transform((v) => Math.min(Math.max(Number(v) || 20, 1), 100)),
  unread_only: z.string().default('false')
    .transform((v) => v === "true"),
});

export const notificationUpdateSchema = z.object({
  id: z.string().uuid().optional(),
  mark_all_read: z.boolean().optional(),
});

export const activityListQuerySchema = z.object({
  page: z.string().default('1')
    .transform((v) => Math.max(Number(v) || 1, 1)),
  limit: z.string().default('25')
    .transform((v) => Math.min(Math.max(Number(v) || 25, 1), 100)),
  module: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});
