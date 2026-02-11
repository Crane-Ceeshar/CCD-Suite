import { z } from 'zod';

// ── Enums ──

export const invoiceStatusSchema = z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']);
export const expenseCategorySchema = z.enum(['travel', 'software', 'office', 'marketing', 'utilities', 'payroll', 'other']);
export const expenseStatusSchema = z.enum(['pending', 'approved', 'rejected', 'reimbursed']);
export const paymentMethodSchema = z.enum(['bank_transfer', 'credit_card', 'cash', 'check', 'other']);

// ── Invoices ──

export const createInvoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500),
  quantity: z.number().positive('Quantity must be positive'),
  unit_price: z.number().nonnegative('Unit price must be non-negative'),
});

export const createInvoiceSchema = z.object({
  invoice_number: z.string().min(1, 'Invoice number is required').max(50),
  contact_id: z.string().uuid().nullable().optional(),
  company_id: z.string().uuid().nullable().optional(),
  issue_date: z.string().optional(),
  due_date: z.string().nullable().optional(),
  tax_rate: z.number().min(0).max(100).default(0),
  currency: z.string().max(10).default('USD'),
  notes: z.string().max(5000).nullable().optional(),
  items: z.array(createInvoiceItemSchema).min(1, 'At least one line item is required'),
});

export const updateInvoiceSchema = z.object({
  invoice_number: z.string().min(1).max(50).optional(),
  contact_id: z.string().uuid().nullable().optional(),
  company_id: z.string().uuid().nullable().optional(),
  status: invoiceStatusSchema.optional(),
  issue_date: z.string().optional(),
  due_date: z.string().nullable().optional(),
  tax_rate: z.number().min(0).max(100).optional(),
  currency: z.string().max(10).optional(),
  notes: z.string().max(5000).nullable().optional(),
});

export const invoiceListQuerySchema = z.object({
  search: z.string().default(''),
  status: z.string().default(''),
  company_id: z.string().default(''),
  contact_id: z.string().default(''),
  sort: z.string().default('created_at'),
  dir: z.enum(['asc', 'desc']).default('desc'),
  limit: z.string().default('50').transform((v) => Math.min(Math.max(parseInt(v, 10) || 50, 1), 100)),
  offset: z.string().default('0').transform((v) => Math.max(parseInt(v, 10) || 0, 0)),
});

// ── Expenses ──

export const createExpenseSchema = z.object({
  category: expenseCategorySchema.default('other'),
  vendor: z.string().max(255).nullable().optional(),
  description: z.string().min(1, 'Description is required').max(2000),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().max(10).default('USD'),
  expense_date: z.string().optional(),
  receipt_url: z.string().max(1000).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
});

export const updateExpenseSchema = z.object({
  category: expenseCategorySchema.optional(),
  vendor: z.string().max(255).nullable().optional(),
  description: z.string().min(1).max(2000).optional(),
  amount: z.number().positive().optional(),
  currency: z.string().max(10).optional(),
  expense_date: z.string().optional(),
  receipt_url: z.string().max(1000).nullable().optional(),
  status: expenseStatusSchema.optional(),
  notes: z.string().max(5000).nullable().optional(),
});

export const expenseListQuerySchema = z.object({
  search: z.string().default(''),
  status: z.string().default(''),
  category: z.string().default(''),
  from: z.string().default(''),
  to: z.string().default(''),
  sort: z.string().default('expense_date'),
  dir: z.enum(['asc', 'desc']).default('desc'),
  limit: z.string().default('50').transform((v) => Math.min(Math.max(parseInt(v, 10) || 50, 1), 100)),
  offset: z.string().default('0').transform((v) => Math.max(parseInt(v, 10) || 0, 0)),
});

export const approveExpenseSchema = z.object({
  action: z.enum(['approve', 'reject']),
  notes: z.string().max(1000).nullable().optional(),
});

// ── Payments ──

export const createPaymentSchema = z.object({
  invoice_id: z.string().uuid().nullable().optional(),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().max(10).default('USD'),
  payment_method: paymentMethodSchema.default('bank_transfer'),
  payment_date: z.string().optional(),
  reference: z.string().max(255).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
});

export const paymentListQuerySchema = z.object({
  invoice_id: z.string().default(''),
  payment_method: z.string().default(''),
  from: z.string().default(''),
  to: z.string().default(''),
  sort: z.string().default('payment_date'),
  dir: z.enum(['asc', 'desc']).default('desc'),
  limit: z.string().default('50').transform((v) => Math.min(Math.max(parseInt(v, 10) || 50, 1), 100)),
  offset: z.string().default('0').transform((v) => Math.max(parseInt(v, 10) || 0, 0)),
});

// ── Revenue & Tax ──

export const revenueQuerySchema = z.object({
  period: z.enum(['30d', '90d', '6m', '1y', 'ytd', 'all']).default('1y'),
});

export const taxQuerySchema = z.object({
  year: z.string().default(new Date().getFullYear().toString()),
  quarter: z.string().default(''),
});

// ── Export ──

export const exportSchema = z.object({
  type: z.enum(['invoices', 'expenses', 'payments']),
  status: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  format: z.enum(['csv']).default('csv'),
});
