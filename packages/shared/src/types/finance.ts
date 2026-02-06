export interface Invoice {
  id: string;
  tenant_id: string;
  contact_id: string | null;
  company_id: string | null;
  invoice_number: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  currency: string;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  items?: InvoiceItem[];
  company?: { id: string; name: string };
  contact?: { id: string; first_name: string; last_name: string };
  payments?: Payment[];
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  sort_order: number;
  created_at: string;
}

export type ExpenseCategory = 'travel' | 'software' | 'office' | 'marketing' | 'utilities' | 'payroll' | 'other';
export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'reimbursed';

export interface Expense {
  id: string;
  tenant_id: string;
  category: ExpenseCategory;
  vendor: string | null;
  description: string;
  amount: number;
  currency: string;
  expense_date: string;
  receipt_url: string | null;
  status: ExpenseStatus;
  approved_by: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type PaymentMethod = 'bank_transfer' | 'credit_card' | 'cash' | 'check' | 'other';

export interface Payment {
  id: string;
  tenant_id: string;
  invoice_id: string | null;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  payment_date: string;
  reference: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  // Joined
  invoice?: Invoice;
}

export interface CreateInvoiceInput {
  invoice_number: string;
  contact_id?: string;
  company_id?: string;
  issue_date?: string;
  due_date?: string;
  tax_rate?: number;
  currency?: string;
  notes?: string;
  items: CreateInvoiceItemInput[];
}

export interface CreateInvoiceItemInput {
  description: string;
  quantity: number;
  unit_price: number;
}

export interface UpdateInvoiceInput {
  status?: InvoiceStatus;
  contact_id?: string;
  company_id?: string;
  issue_date?: string;
  due_date?: string;
  tax_rate?: number;
  notes?: string;
}

export interface CreateExpenseInput {
  category: ExpenseCategory;
  vendor?: string;
  description: string;
  amount: number;
  currency?: string;
  expense_date?: string;
  receipt_url?: string;
  notes?: string;
}

export interface UpdateExpenseInput {
  category?: ExpenseCategory;
  vendor?: string;
  description?: string;
  amount?: number;
  expense_date?: string;
  receipt_url?: string;
  status?: ExpenseStatus;
  notes?: string;
}

export interface CreatePaymentInput {
  invoice_id?: string;
  amount: number;
  currency?: string;
  payment_method?: PaymentMethod;
  payment_date?: string;
  reference?: string;
  notes?: string;
}
