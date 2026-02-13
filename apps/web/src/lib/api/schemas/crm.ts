import { z } from 'zod';

// ── Enums ──

export const companyStatusSchema = z.enum(['active', 'inactive', 'prospect']);
export const contactStatusSchema = z.enum(['active', 'inactive', 'lead']);
export const dealStatusSchema = z.enum(['open', 'won', 'lost']);
export const activityTypeSchema = z.enum(['call', 'email', 'meeting', 'task', 'note']);

// ── Companies ──

export const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(255),
  industry: z.string().max(255).nullable().optional(),
  website: z.string().max(500).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  email: z.string().email().max(255).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  state: z.string().max(100).nullable().optional(),
  country: z.string().max(100).nullable().optional(),
  status: companyStatusSchema.default('active'),
  notes: z.string().max(5000).nullable().optional(),
});

export const updateCompanySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  industry: z.string().max(255).nullable().optional(),
  website: z.string().max(500).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  email: z.string().email().max(255).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  state: z.string().max(100).nullable().optional(),
  country: z.string().max(100).nullable().optional(),
  status: companyStatusSchema.optional(),
  notes: z.string().max(5000).nullable().optional(),
});

export const companyListQuerySchema = z.object({
  search: z.string().default(''),
  status: z.string().default(''),
  limit: z.string().default('100').transform((v) => Math.min(Math.max(parseInt(v, 10) || 100, 1), 200)),
  offset: z.string().default('0').transform((v) => Math.max(parseInt(v, 10) || 0, 0)),
});

// ── Contacts ──

export const createContactSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email().max(255).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  job_title: z.string().max(200).nullable().optional(),
  company_id: z.string().uuid().nullable().optional(),
  status: contactStatusSchema.default('active'),
  notes: z.string().max(5000).nullable().optional(),
  website: z.string().max(500).nullable().optional(),
  lead_source: z.string().max(100).nullable().optional(),
  lead_status: z.string().max(100).nullable().optional(),
  qualification: z.string().max(100).nullable().optional(),
  priority: z.string().max(50).nullable().optional(),
  comment: z.string().max(5000).nullable().optional(),
});

export const updateContactSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  email: z.string().email().max(255).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  job_title: z.string().max(200).nullable().optional(),
  company_id: z.string().uuid().nullable().optional(),
  status: contactStatusSchema.optional(),
  notes: z.string().max(5000).nullable().optional(),
  website: z.string().max(500).nullable().optional(),
  lead_source: z.string().max(100).nullable().optional(),
  lead_status: z.string().max(100).nullable().optional(),
  qualification: z.string().max(100).nullable().optional(),
  priority: z.string().max(50).nullable().optional(),
  comment: z.string().max(5000).nullable().optional(),
});

export const contactListQuerySchema = z.object({
  search: z.string().default(''),
  status: z.string().default(''),
  company_id: z.string().default(''),
  limit: z.string().default('100').transform((v) => Math.min(Math.max(parseInt(v, 10) || 100, 1), 200)),
  offset: z.string().default('0').transform((v) => Math.max(parseInt(v, 10) || 0, 0)),
});

// ── Deals ──

export const createDealSchema = z.object({
  title: z.string().min(1, 'Deal title is required').max(255),
  pipeline_id: z.string().uuid('Pipeline ID is required'),
  stage_id: z.string().uuid('Stage ID is required'),
  value: z.number().nonnegative().default(0),
  currency: z.string().max(10).default('USD'),
  company_id: z.string().uuid().nullable().optional(),
  contact_id: z.string().uuid().nullable().optional(),
  expected_close_date: z.string().nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
});

export const updateDealSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  pipeline_id: z.string().uuid().optional(),
  stage_id: z.string().uuid().optional(),
  value: z.number().nonnegative().optional(),
  currency: z.string().max(10).optional(),
  company_id: z.string().uuid().nullable().optional(),
  contact_id: z.string().uuid().nullable().optional(),
  status: dealStatusSchema.optional(),
  expected_close_date: z.string().nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  position: z.number().nonnegative().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
});

export const dealListQuerySchema = z.object({
  search: z.string().default(''),
  status: z.string().default(''),
  stage_id: z.string().default(''),
  company_id: z.string().default(''),
  contact_id: z.string().default(''),
  limit: z.string().default('100').transform((v) => Math.min(Math.max(parseInt(v, 10) || 100, 1), 200)),
  offset: z.string().default('0').transform((v) => Math.max(parseInt(v, 10) || 0, 0)),
});

// ── Products ──

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  description: z.string().max(5000).nullable().optional(),
  sku: z.string().max(100).nullable().optional(),
  price: z.number().nonnegative().default(0),
  currency: z.string().max(10).default('USD'),
  category: z.string().max(100).nullable().optional(),
  is_active: z.boolean().default(true),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).nullable().optional(),
  sku: z.string().max(100).nullable().optional(),
  price: z.number().nonnegative().optional(),
  currency: z.string().max(10).optional(),
  category: z.string().max(100).nullable().optional(),
  is_active: z.boolean().optional(),
});

export const productListQuerySchema = z.object({
  search: z.string().default(''),
  limit: z.string().default('100').transform((v) => Math.min(Math.max(parseInt(v, 10) || 100, 1), 200)),
  offset: z.string().default('0').transform((v) => Math.max(parseInt(v, 10) || 0, 0)),
});

// ── Activities ──

export const createActivitySchema = z.object({
  type: activityTypeSchema,
  title: z.string().min(1, 'Activity title is required').max(255),
  description: z.string().max(5000).nullable().optional(),
  deal_id: z.string().uuid().nullable().optional(),
  contact_id: z.string().uuid().nullable().optional(),
  company_id: z.string().uuid().nullable().optional(),
  scheduled_at: z.string().nullable().optional(),
});

export const updateActivitySchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).nullable().optional(),
  type: activityTypeSchema.optional(),
  scheduled_at: z.string().nullable().optional(),
  is_completed: z.boolean().optional(),
});

export const activityListQuerySchema = z.object({
  type: z.string().default(''),
  deal_id: z.string().default(''),
  contact_id: z.string().default(''),
  company_id: z.string().default(''),
  limit: z.string().default('100').transform((v) => Math.min(Math.max(parseInt(v, 10) || 100, 1), 200)),
  offset: z.string().default('0').transform((v) => Math.max(parseInt(v, 10) || 0, 0)),
});

// ── Pipelines ──

export const createPipelineSchema = z.object({
  name: z.string().min(1, 'Pipeline name is required').max(255),
  is_default: z.boolean().default(false),
});

export const updatePipelineSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  is_default: z.boolean().optional(),
});
