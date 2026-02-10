import { z } from 'zod';
import { periodSchema } from './analytics';

// ── Goals ──────────────────────────────────────────────────────────

export const goalCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(1000).nullable().optional(),
  metric_key: z.string().min(1).max(100),
  target_value: z.number(),
  current_value: z.number().default(0),
  period: periodSchema,
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export const goalUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  metric_key: z.string().min(1).max(100).optional(),
  target_value: z.number().optional(),
  current_value: z.number().optional(),
  period: periodSchema.optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  status: z.enum(['active', 'completed', 'missed']).optional(),
});

// ── Alerts ─────────────────────────────────────────────────────────

export const alertCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(1000).nullable().optional(),
  metric_key: z.string().min(1).max(100),
  condition: z.enum(['above', 'below', 'equals', 'change_pct']),
  threshold: z.number(),
  channel: z.enum(['email', 'in_app', 'both']).default('in_app'),
  recipients: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
});

export const alertUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  metric_key: z.string().min(1).max(100).optional(),
  condition: z.enum(['above', 'below', 'equals', 'change_pct']).optional(),
  threshold: z.number().optional(),
  channel: z.enum(['email', 'in_app', 'both']).optional(),
  recipients: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
});

// ── Custom Metrics ─────────────────────────────────────────────────

export const customMetricCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(1000).nullable().optional(),
  formula: z.string().min(1, 'Formula is required').max(1000),
  format: z.enum(['number', 'currency', 'percentage']).default('number'),
});

export const customMetricUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  formula: z.string().min(1).max(1000).optional(),
  format: z.enum(['number', 'currency', 'percentage']).optional(),
});

// ── Dashboard Sharing ──────────────────────────────────────────────

export const dashboardShareSchema = z.object({
  is_public: z.boolean(),
});

// ── Report Schedule ────────────────────────────────────────────────

export const reportScheduleSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  recipients: z.array(z.string().email()).min(1, 'At least one recipient is required'),
  day_of_week: z.number().min(0).max(6).optional(),
  time: z.string().optional(),
  format: z.enum(['pdf', 'csv', 'json']).default('pdf'),
  enabled: z.boolean().default(true),
});

// ── Anomaly Detection ──────────────────────────────────────────────

export const anomalyQuerySchema = z.object({
  metric: z.enum(['revenue', 'engagement', 'content', 'all']).default('all'),
  period: periodSchema,
  sigma: z.coerce.number().min(1).max(5).default(2),
});

// ── Funnel ─────────────────────────────────────────────────────────

export const funnelQuerySchema = z.object({
  period: periodSchema,
});
