import { z } from 'zod';

// ── Enums ──

export const employmentTypeSchema = z.enum(['full_time', 'part_time', 'contract', 'intern']);
export const employeeStatusSchema = z.enum(['active', 'on_leave', 'terminated']);
export const leaveTypeSchema = z.enum(['annual', 'sick', 'personal', 'maternity', 'paternity', 'unpaid']);
export const leaveStatusSchema = z.enum(['pending', 'approved', 'rejected']);
export const attendanceStatusSchema = z.enum(['present', 'absent', 'late', 'half_day']);
export const payrollStatusSchema = z.enum(['draft', 'processing', 'completed', 'cancelled']);
export const documentTypeSchema = z.enum(['offer_letter', 'contract', 'id_document', 'certification', 'tax_form', 'other']);
export const reviewStatusSchema = z.enum(['draft', 'submitted', 'acknowledged']);

// ── Employees ──

export const createEmployeeSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email().max(255).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  department_id: z.string().uuid().nullable().optional(),
  job_title: z.string().max(200).nullable().optional(),
  employment_type: employmentTypeSchema.default('full_time'),
  hire_date: z.string().optional(),
  salary: z.number().nonnegative().nullable().optional(),
  salary_currency: z.string().max(10).default('USD'),
  manager_id: z.string().uuid().nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  emergency_contact_name: z.string().max(200).nullable().optional(),
  emergency_contact_phone: z.string().max(50).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
});

export const updateEmployeeSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  email: z.string().email().max(255).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  department_id: z.string().uuid().nullable().optional(),
  job_title: z.string().max(200).nullable().optional(),
  employment_type: employmentTypeSchema.optional(),
  status: employeeStatusSchema.optional(),
  salary: z.number().nonnegative().nullable().optional(),
  salary_currency: z.string().max(10).optional(),
  manager_id: z.string().uuid().nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  emergency_contact_name: z.string().max(200).nullable().optional(),
  emergency_contact_phone: z.string().max(50).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  termination_date: z.string().nullable().optional(),
});

export const employeeListQuerySchema = z.object({
  search: z.string().default(''),
  status: z.string().default(''),
  department_id: z.string().default(''),
  employment_type: z.string().default(''),
  sort: z.string().default('last_name'),
  dir: z.enum(['asc', 'desc']).default('asc'),
  limit: z.string().default('50').transform((v) => Math.min(Math.max(parseInt(v, 10) || 50, 1), 100)),
  offset: z.string().default('0').transform((v) => Math.max(parseInt(v, 10) || 0, 0)),
});

// ── Departments ──

export const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required').max(200),
  description: z.string().max(2000).nullable().optional(),
  head_id: z.string().uuid().nullable().optional(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  head_id: z.string().uuid().nullable().optional(),
});

export const departmentListQuerySchema = z.object({
  search: z.string().default(''),
  sort: z.string().default('name'),
  dir: z.enum(['asc', 'desc']).default('asc'),
  limit: z.string().default('50').transform((v) => Math.min(Math.max(parseInt(v, 10) || 50, 1), 100)),
  offset: z.string().default('0').transform((v) => Math.max(parseInt(v, 10) || 0, 0)),
});

// ── Leave Requests ──

export const createLeaveRequestSchema = z.object({
  employee_id: z.string().uuid(),
  type: leaveTypeSchema,
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  days_count: z.number().positive(),
  reason: z.string().max(2000).nullable().optional(),
});

export const approveLeaveSchema = z.object({
  action: z.enum(['approve', 'reject']),
  notes: z.string().max(1000).nullable().optional(),
});

export const leaveListQuerySchema = z.object({
  status: z.string().default(''),
  employee_id: z.string().default(''),
  type: z.string().default(''),
  from: z.string().default(''),
  to: z.string().default(''),
  sort: z.string().default('created_at'),
  dir: z.enum(['asc', 'desc']).default('desc'),
  limit: z.string().default('50').transform((v) => Math.min(Math.max(parseInt(v, 10) || 50, 1), 100)),
  offset: z.string().default('0').transform((v) => Math.max(parseInt(v, 10) || 0, 0)),
});

// ── Attendance ──

export const createAttendanceSchema = z.object({
  employee_id: z.string().uuid(),
  date: z.string().min(1, 'Date is required'),
  clock_in: z.string().nullable().optional(),
  clock_out: z.string().nullable().optional(),
  status: attendanceStatusSchema.default('present'),
  notes: z.string().max(2000).nullable().optional(),
});

export const updateAttendanceSchema = z.object({
  clock_in: z.string().nullable().optional(),
  clock_out: z.string().nullable().optional(),
  status: attendanceStatusSchema.optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export const attendanceListQuerySchema = z.object({
  employee_id: z.string().default(''),
  status: z.string().default(''),
  from: z.string().default(''),
  to: z.string().default(''),
  sort: z.string().default('date'),
  dir: z.enum(['asc', 'desc']).default('desc'),
  limit: z.string().default('50').transform((v) => Math.min(Math.max(parseInt(v, 10) || 50, 1), 100)),
  offset: z.string().default('0').transform((v) => Math.max(parseInt(v, 10) || 0, 0)),
});

// ── Payroll ──

export const createPayrollRunSchema = z.object({
  period_start: z.string().min(1, 'Period start is required'),
  period_end: z.string().min(1, 'Period end is required'),
  currency: z.string().max(10).default('USD'),
  notes: z.string().max(5000).nullable().optional(),
});

export const processPayrollSchema = z.object({
  action: z.enum(['process', 'complete', 'cancel']),
  notes: z.string().max(1000).nullable().optional(),
});

export const payrollListQuerySchema = z.object({
  status: z.string().default(''),
  from: z.string().default(''),
  to: z.string().default(''),
  sort: z.string().default('created_at'),
  dir: z.enum(['asc', 'desc']).default('desc'),
  limit: z.string().default('50').transform((v) => Math.min(Math.max(parseInt(v, 10) || 50, 1), 100)),
  offset: z.string().default('0').transform((v) => Math.max(parseInt(v, 10) || 0, 0)),
});

// ── Leave Balances ──

export const updateLeaveBalanceSchema = z.object({
  total_days: z.number().nonnegative().optional(),
  used_days: z.number().nonnegative().optional(),
  carry_over_days: z.number().nonnegative().optional(),
});

export const leaveBalanceQuerySchema = z.object({
  employee_id: z.string().default(''),
  year: z.string().default('').transform((v) => (v ? parseInt(v, 10) : new Date().getFullYear())),
});

// ── Performance Reviews ──

export const createPerformanceReviewSchema = z.object({
  employee_id: z.string().uuid(),
  reviewer_id: z.string().uuid().nullable().optional(),
  review_period: z.string().min(1, 'Review period is required').max(100),
  review_date: z.string().optional(),
  rating: z.number().min(1).max(5).nullable().optional(),
  strengths: z.string().max(5000).nullable().optional(),
  areas_for_improvement: z.string().max(5000).nullable().optional(),
  goals: z.string().max(5000).nullable().optional(),
  overall_comments: z.string().max(5000).nullable().optional(),
});

export const updatePerformanceReviewSchema = z.object({
  reviewer_id: z.string().uuid().nullable().optional(),
  review_period: z.string().min(1).max(100).optional(),
  review_date: z.string().optional(),
  rating: z.number().min(1).max(5).nullable().optional(),
  strengths: z.string().max(5000).nullable().optional(),
  areas_for_improvement: z.string().max(5000).nullable().optional(),
  goals: z.string().max(5000).nullable().optional(),
  overall_comments: z.string().max(5000).nullable().optional(),
  status: reviewStatusSchema.optional(),
});

export const reviewListQuerySchema = z.object({
  employee_id: z.string().default(''),
  status: z.string().default(''),
  sort: z.string().default('review_date'),
  dir: z.enum(['asc', 'desc']).default('desc'),
  limit: z.string().default('50').transform((v) => Math.min(Math.max(parseInt(v, 10) || 50, 1), 100)),
  offset: z.string().default('0').transform((v) => Math.max(parseInt(v, 10) || 0, 0)),
});

// ── Leave Policies ──

export const createLeavePolicySchema = z.object({
  name: z.string().min(1, 'Policy name is required').max(200),
  employment_type: z.enum(['full_time', 'part_time', 'contract', 'intern', 'all']),
  leave_type: leaveTypeSchema,
  days_per_year: z.number().nonnegative(),
  carry_over_max: z.number().nonnegative().default(0),
  requires_approval: z.boolean().default(true),
  min_notice_days: z.number().int().nonnegative().default(0),
  max_consecutive_days: z.number().int().positive().nullable().optional(),
});

export const updateLeavePolicySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  employment_type: z.enum(['full_time', 'part_time', 'contract', 'intern', 'all']).optional(),
  leave_type: leaveTypeSchema.optional(),
  days_per_year: z.number().nonnegative().optional(),
  carry_over_max: z.number().nonnegative().optional(),
  requires_approval: z.boolean().optional(),
  min_notice_days: z.number().int().nonnegative().optional(),
  max_consecutive_days: z.number().int().positive().nullable().optional(),
  is_active: z.boolean().optional(),
});

// ── Export ──

export const hrExportSchema = z.object({
  type: z.enum(['employees', 'attendance', 'payroll', 'leave']),
  status: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  format: z.enum(['csv']).default('csv'),
});

// ── Contracts ──

export const contractTypeSchema = z.enum(['employment', 'nda', 'amendment', 'other']);
export const contractStatusSchema = z.enum(['draft', 'sent', 'viewed', 'signed', 'expired', 'cancelled']);
export const signatureMethodSchema = z.enum(['draw', 'type']);
export const hrTokenTypeSchema = z.enum(['leave_request', 'contract_signing', 'document_upload']);

export const createContractSchema = z.object({
  employee_id: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(500),
  type: contractTypeSchema.default('employment'),
  template_id: z.string().uuid().nullable().optional(),
  content: z.any().optional(), // JSONB sections
  file_url: z.string().max(2000).nullable().optional(),
  expires_at: z.string().nullable().optional(),
});

export const updateContractSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  type: contractTypeSchema.optional(),
  content: z.any().optional(),
  file_url: z.string().max(2000).nullable().optional(),
  status: contractStatusSchema.optional(),
  expires_at: z.string().nullable().optional(),
});

export const sendContractSchema = z.object({
  message: z.string().max(2000).nullable().optional(),
});

export const contractListQuerySchema = z.object({
  employee_id: z.string().default(''),
  status: z.string().default(''),
  type: z.string().default(''),
  search: z.string().default(''),
  sort: z.string().default('created_at'),
  dir: z.enum(['asc', 'desc']).default('desc'),
  limit: z.string().default('50').transform((v) => Math.min(Math.max(parseInt(v, 10) || 50, 1), 100)),
  offset: z.string().default('0').transform((v) => Math.max(parseInt(v, 10) || 0, 0)),
});

// ── Contract Templates ──

export const createContractTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(200),
  description: z.string().max(2000).nullable().optional(),
  content: z.any().default([]),  // JSONB sections/clauses
  variables: z.any().default([]), // placeholder definitions
});

export const updateContractTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  content: z.any().optional(),
  variables: z.any().optional(),
  is_active: z.boolean().optional(),
});

export const templateListQuerySchema = z.object({
  search: z.string().default(''),
  is_active: z.string().default(''),
  sort: z.string().default('name'),
  dir: z.enum(['asc', 'desc']).default('asc'),
  limit: z.string().default('50').transform((v) => Math.min(Math.max(parseInt(v, 10) || 50, 1), 100)),
  offset: z.string().default('0').transform((v) => Math.max(parseInt(v, 10) || 0, 0)),
});

// ── Signatures ──

export const submitSignatureSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  signature_data: z.string().min(1, 'Signature is required'), // base64 PNG
  signature_method: signatureMethodSchema,
  typed_name: z.string().max(200).nullable().optional(),
});

// ── HR Form Tokens (Self-Service) ──

export const sendLeaveFormSchema = z.object({
  employee_id: z.string().uuid(),
  message: z.string().max(2000).nullable().optional(),
});

export const submitLeaveFormSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  leave_type: leaveTypeSchema,
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  days_count: z.number().positive(),
  reason: z.string().max(2000).nullable().optional(),
});

export const verifyTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});
