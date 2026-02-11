import { z } from 'zod';

// ── Enums ──

export const portalProjectStatusSchema = z.enum(['active', 'completed', 'on_hold']);
export const milestoneStatusSchema = z.enum(['upcoming', 'in_progress', 'completed', 'overdue']);
export const deliverableStatusSchema = z.enum(['pending_review', 'approved', 'revision_requested', 'delivered']);

// ── Portal Projects ──

export const createPortalProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(5000).nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
  client_id: z.string().uuid().nullable().optional(),
  status: portalProjectStatusSchema.default('active'),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  budget: z.number().nonnegative().nullable().optional(),
  metadata: z.record(z.unknown()).default({}),
});

export const updatePortalProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
  client_id: z.string().uuid().nullable().optional(),
  status: portalProjectStatusSchema.optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  budget: z.number().nonnegative().nullable().optional(),
  progress: z.number().int().min(0).max(100).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const portalProjectListQuerySchema = z.object({
  search: z.string().default(''),
  status: z.string().default(''),
  client_id: z.string().default(''),
  sort: z.string().default('created_at'),
  dir: z.enum(['asc', 'desc']).default('desc'),
  limit: z.string().default('50').transform((v) => Math.min(Math.max(parseInt(v, 10) || 50, 1), 100)),
  offset: z.string().default('0').transform((v) => Math.max(parseInt(v, 10) || 0, 0)),
});

// ── Milestones ──

export const createMilestoneSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(2000).nullable().optional(),
  due_date: z.string().nullable().optional(),
  status: milestoneStatusSchema.default('upcoming'),
  position: z.number().int().nonnegative().optional(),
});

export const updateMilestoneSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).nullable().optional(),
  due_date: z.string().nullable().optional(),
  status: milestoneStatusSchema.optional(),
  position: z.number().int().nonnegative().optional(),
});

// ── Deliverables ──

export const createDeliverableSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(2000).nullable().optional(),
  file_url: z.string().nullable().optional(),
  file_name: z.string().max(500).nullable().optional(),
  file_size: z.number().nonnegative().nullable().optional(),
});

export const updateDeliverableSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).nullable().optional(),
  status: deliverableStatusSchema.optional(),
  feedback: z.string().max(5000).nullable().optional(),
  file_url: z.string().nullable().optional(),
  file_name: z.string().max(500).nullable().optional(),
  file_size: z.number().nonnegative().nullable().optional(),
});

// ── Messages ──

export const createMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(10000),
  attachments: z.array(z.record(z.unknown())).default([]),
  is_internal: z.boolean().default(false),
});

// ── Access Tokens ──

export const createAccessTokenSchema = z.object({
  client_email: z.string().email('Valid email is required'),
  portal_project_id: z.string().uuid().nullable().optional(),
  expires_in_days: z.number().int().min(1).max(90).default(7),
});
