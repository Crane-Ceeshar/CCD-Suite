import { z } from 'zod';

// ── Enums ──

export const projectStatusSchema = z.enum(['active', 'on_hold', 'completed', 'cancelled']);
export const projectPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);
export const taskStatusSchema = z.enum(['todo', 'in_progress', 'review', 'done', 'cancelled']);
export const taskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);
export const memberRoleSchema = z.enum(['owner', 'manager', 'member', 'viewer']);

// ── Projects ──

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(5000).nullable().optional(),
  status: projectStatusSchema.default('active'),
  priority: projectPrioritySchema.default('medium'),
  start_date: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  budget: z.number().nonnegative().nullable().optional(),
  currency: z.string().max(10).default('USD'),
  color: z.string().max(50).nullable().optional(),
  client_id: z.string().uuid().nullable().optional(),
  metadata: z.record(z.unknown()).default({}),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).nullable().optional(),
  status: projectStatusSchema.optional(),
  priority: projectPrioritySchema.optional(),
  start_date: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  budget: z.number().nonnegative().nullable().optional(),
  currency: z.string().max(10).optional(),
  color: z.string().max(50).nullable().optional(),
  client_id: z.string().uuid().nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const projectListQuerySchema = z.object({
  search: z.string().default(''),
  status: z.string().default(''),
  priority: z.string().default(''),
  sort: z.string().default('created_at'),
  dir: z.enum(['asc', 'desc']).default('desc'),
  limit: z.string().default('50').transform((v) => Math.min(Math.max(parseInt(v, 10) || 50, 1), 100)),
  offset: z.string().default('0').transform((v) => Math.max(parseInt(v, 10) || 0, 0)),
});

// ── Tasks ──

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().max(10000).nullable().optional(),
  status: taskStatusSchema.default('todo'),
  priority: taskPrioritySchema.default('medium'),
  due_date: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  estimated_hours: z.number().nonnegative().nullable().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  labels: z.array(z.string().max(50)).default([]),
  story_points: z.number().int().nonnegative().nullable().optional(),
  sprint_id: z.string().uuid().nullable().optional(),
  metadata: z.record(z.unknown()).default({}),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(10000).nullable().optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  due_date: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  estimated_hours: z.number().nonnegative().nullable().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  labels: z.array(z.string().max(50)).optional(),
  position: z.number().int().nonnegative().optional(),
  story_points: z.number().int().nonnegative().nullable().optional(),
  sprint_id: z.string().uuid().nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const taskListQuerySchema = z.object({
  search: z.string().default(''),
  status: z.string().default(''),
  priority: z.string().default(''),
  assigned_to: z.string().default(''),
  label: z.string().default(''),
  sprint_id: z.string().default(''),
  parent_id: z.string().default(''),
  sort: z.string().default('position'),
  dir: z.enum(['asc', 'desc']).default('asc'),
  limit: z.string().default('100').transform((v) => Math.min(Math.max(parseInt(v, 10) || 100, 1), 500)),
  offset: z.string().default('0').transform((v) => Math.max(parseInt(v, 10) || 0, 0)),
});

export const taskReorderSchema = z.object({
  items: z.array(z.object({
    id: z.string().uuid(),
    status: taskStatusSchema.optional(),
    position: z.number().int().nonnegative(),
  })).min(1, 'At least one item is required'),
});

// ── Members ──

export const createProjectMemberSchema = z.object({
  user_id: z.string().uuid('user_id is required'),
  role: memberRoleSchema.default('member'),
});

export const updateProjectMemberSchema = z.object({
  role: memberRoleSchema,
});

// ── Time Entries ──

export const createTimeEntrySchema = z.object({
  task_id: z.string().uuid('task_id is required'),
  description: z.string().max(1000).nullable().optional(),
  started_at: z.string().min(1, 'started_at is required'),
  ended_at: z.string().nullable().optional(),
  duration_minutes: z.number().int().nonnegative().nullable().optional(),
  is_running: z.boolean().default(false),
  billable: z.boolean().default(true),
  hourly_rate: z.number().nonnegative().nullable().optional(),
});

export const updateTimeEntrySchema = z.object({
  description: z.string().max(1000).nullable().optional(),
  ended_at: z.string().nullable().optional(),
  duration_minutes: z.number().int().nonnegative().nullable().optional(),
  is_running: z.boolean().optional(),
  billable: z.boolean().optional(),
  hourly_rate: z.number().nonnegative().nullable().optional(),
});

export const timeEntryListQuerySchema = z.object({
  task_id: z.string().default(''),
  user_id: z.string().default(''),
  from: z.string().default(''),
  to: z.string().default(''),
  billable: z.string().default(''),
  limit: z.string().default('100').transform((v) => Math.min(Math.max(parseInt(v, 10) || 100, 1), 500)),
  offset: z.string().default('0').transform((v) => Math.max(parseInt(v, 10) || 0, 0)),
});

export const timesheetQuerySchema = z.object({
  from: z.string().min(1, 'from is required'),
  to: z.string().min(1, 'to is required'),
  user_id: z.string().default(''),
  group_by: z.enum(['date', 'user', 'task']).default('date'),
});

// ── Sprints ──

export const sprintStatusSchema = z.enum(['planning', 'active', 'completed', 'cancelled']);

export const createSprintSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  goal: z.string().max(2000).nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  capacity_points: z.number().int().nonnegative().nullable().optional(),
});

export const updateSprintSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  goal: z.string().max(2000).nullable().optional(),
  status: sprintStatusSchema.optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  capacity_points: z.number().int().nonnegative().nullable().optional(),
});

export const bulkAssignSprintSchema = z.object({
  task_ids: z.array(z.string().uuid()).min(1, 'At least one task is required'),
  sprint_id: z.string().uuid().nullable(),
});
