import { z } from 'zod';

export const contentTypeSchema = z.enum([
  'article', 'blog_post', 'social_post', 'email', 'landing_page', 'video', 'podcast',
]);

export const contentStatusSchema = z.enum([
  'draft', 'review', 'approved', 'scheduled', 'published', 'archived',
]);

export const contentCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  slug: z.string().max(500).optional(),
  content_type: contentTypeSchema.default('article'),
  body: z.string().nullable().optional(),
  excerpt: z.string().max(1000).nullable().optional(),
  status: contentStatusSchema.default('draft'),
  publish_date: z.string().nullable().optional(),
  platforms: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  seo_title: z.string().max(255).nullable().optional(),
  seo_description: z.string().max(500).nullable().optional(),
  featured_image_url: z.string().url().nullable().optional(),
  metadata: z.record(z.unknown()).default({}),
  category_id: z.string().uuid().nullable().optional(),
});

export const contentUpdateSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  slug: z.string().max(500).optional(),
  content_type: contentTypeSchema.optional(),
  body: z.string().nullable().optional(),
  excerpt: z.string().max(1000).nullable().optional(),
  status: contentStatusSchema.optional(),
  publish_date: z.string().nullable().optional(),
  platforms: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  seo_title: z.string().max(255).nullable().optional(),
  seo_description: z.string().max(500).nullable().optional(),
  featured_image_url: z.string().url().nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
  category_id: z.string().uuid().nullable().optional(),
  expected_updated_at: z.string().optional(),
});

export const contentListQuerySchema = z.object({
  search: z.string().default(''),
  status: z.string().default(''),
  type: z.string().default(''),
  category_id: z.string().default(''),
  sort: z.string().default('created_at'),
  dir: z.enum(['asc', 'desc']).default('desc'),
  limit: z.string().default('50').transform((v) => Math.min(Math.max(parseInt(v, 10) || 50, 1), 100)),
  offset: z.string().default('0').transform((v) => Math.max(parseInt(v, 10) || 0, 0)),
});

export const calendarQuerySchema = z.object({
  from: z.string().min(1, 'from param is required'),
  to: z.string().min(1, 'to param is required'),
});

export const approvalCreateSchema = z.object({
  content_item_id: z.string().uuid('content_item_id is required'),
  reviewer_id: z.string().uuid().nullable().optional(),
});

export const approvalActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'request_changes'], {
    required_error: 'Action is required',
    invalid_type_error: 'Must be approve, reject, or request_changes',
  }),
  comments: z.string().max(2000).nullable().optional(),
});

export const templateCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(1000).nullable().optional(),
  content_type: contentTypeSchema.default('article'),
  body_template: z.string().default(''),
  metadata_template: z.record(z.unknown()).default({}),
});

export const templateUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  content_type: contentTypeSchema.optional(),
  body_template: z.string().optional(),
  metadata_template: z.record(z.unknown()).optional(),
});

export const categoryCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  slug: z.string().max(255).optional(),
  color: z.string().max(50).nullable().optional(),
});

export const categoryUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().max(255).optional(),
  color: z.string().max(50).nullable().optional(),
});

export const assetCreateSchema = z.object({
  file_name: z.string().min(1, 'file_name is required').max(500),
  file_type: z.string().max(100).default('application/octet-stream'),
  file_size: z.number().nonnegative().default(0),
  url: z.string().min(1, 'url is required'),
  thumbnail_url: z.string().nullable().optional(),
  alt_text: z.string().max(500).nullable().optional(),
  metadata: z.record(z.unknown()).default({}),
});

export const commentCreateSchema = z.object({
  body: z.string().min(1, 'Comment body is required').max(5000),
  parent_id: z.string().uuid().optional(),
  position_anchor: z.string().optional(),
  mentions: z.array(z.string().uuid()).default([]),
});

export const commentUpdateSchema = z.object({
  body: z.string().min(1).max(5000).optional(),
  resolved: z.boolean().optional(),
});

export const commentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
