import { z } from 'zod';

export const periodSchema = z.enum(['7d', '30d', '90d', 'ytd']).default('30d');
export const metricSchema = z.enum(['revenue', 'content', 'social', 'seo', 'all']).default('all');

export const overviewQuerySchema = z.object({
  period: periodSchema,
});

export const trendsQuerySchema = z.object({
  period: periodSchema,
  metric: metricSchema,
});

export const insightsBodySchema = z.object({
  moduleContext: z.string().optional(),
  period: periodSchema,
}).partial();

export const reportCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(1000).nullable().optional(),
  report_type: z.enum(['performance', 'content', 'social', 'seo', 'custom']).default('performance'),
  config: z.record(z.unknown()).default({}),
  schedule: z.string().nullable().optional(),
});

export const reportExportSchema = z.object({
  report_id: z.string().uuid().optional(),
  report_type: z.enum(['performance', 'content', 'social', 'seo', 'custom']),
  config: z.object({
    metrics: z.array(z.string()).min(1, 'At least one metric is required'),
    period: periodSchema,
  }),
  format: z.enum(['csv', 'json']).default('json'),
});

export const dashboardCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).default('New Dashboard'),
  description: z.string().max(1000).nullable().optional(),
  is_default: z.boolean().default(false),
  layout: z.array(z.unknown()).default([]),
});

export const dashboardUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  layout: z.array(z.unknown()).optional(),
  is_default: z.boolean().optional(),
});

export const widgetCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255).default('New Widget'),
  widget_type: z.enum(['stat_card', 'line_chart', 'bar_chart', 'pie_chart', 'area_chart', 'table', 'metric']).default('stat_card'),
  data_source: z.string().max(255).default(''),
  config: z.record(z.unknown()).default({}),
  position: z.object({
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
  }).default({ x: 0, y: 0, w: 4, h: 3 }),
});

export const widgetUpdateSchema = z.object({
  widgetId: z.string().uuid('widgetId is required'),
  title: z.string().min(1).max(255).optional(),
  widget_type: z.string().optional(),
  data_source: z.string().max(255).optional(),
  config: z.record(z.unknown()).optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
  }).optional(),
});

export const widgetDeleteSchema = z.object({
  widgetId: z.string().uuid('widgetId is required'),
});
