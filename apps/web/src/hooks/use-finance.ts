'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';

// ── Filter interfaces ──

interface InvoiceFilters {
  search?: string;
  status?: string;
  company_id?: string;
  contact_id?: string;
  sort?: string;
  dir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

interface ExpenseFilters {
  search?: string;
  status?: string;
  category?: string;
  from?: string;
  to?: string;
  sort?: string;
  dir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

interface PaymentFilters {
  invoice_id?: string;
  payment_method?: string;
  from?: string;
  to?: string;
  sort?: string;
  dir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

function buildQuery(filters: object): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : '';
}

// ── Dashboard Stats ──

export function useFinanceStats() {
  return useQuery({
    queryKey: ['finance', 'stats'],
    queryFn: () => apiGet('/api/finance/stats'),
  });
}

// ── Invoices ──

export function useInvoices(filters: InvoiceFilters = {}) {
  return useQuery({
    queryKey: ['finance', 'invoices', filters],
    queryFn: () => apiGet(`/api/finance/invoices${buildQuery(filters)}`),
  });
}

export function useInvoice(id: string | null) {
  return useQuery({
    queryKey: ['finance', 'invoices', id],
    queryFn: () => apiGet(`/api/finance/invoices/${id}`),
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPost('/api/finance/invoices', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'invoices'] });
      queryClient.invalidateQueries({ queryKey: ['finance', 'stats'] });
    },
  });
}

export function useUpdateInvoice(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPatch(`/api/finance/invoices/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'invoices'] });
      queryClient.invalidateQueries({ queryKey: ['finance', 'stats'] });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/finance/invoices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'invoices'] });
      queryClient.invalidateQueries({ queryKey: ['finance', 'stats'] });
    },
  });
}

export function useSendInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost(`/api/finance/invoices/${id}/send`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'invoices'] });
      queryClient.invalidateQueries({ queryKey: ['finance', 'stats'] });
    },
  });
}

// ── Invoice Payments ──

export function useInvoicePayments(invoiceId: string | null) {
  return useQuery({
    queryKey: ['finance', 'invoices', invoiceId, 'payments'],
    queryFn: () => apiGet(`/api/finance/invoices/${invoiceId}/payments`),
    enabled: !!invoiceId,
  });
}

export function useRecordInvoicePayment(invoiceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost(`/api/finance/invoices/${invoiceId}/payments`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'invoices'] });
      queryClient.invalidateQueries({ queryKey: ['finance', 'payments'] });
      queryClient.invalidateQueries({ queryKey: ['finance', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['finance', 'revenue'] });
    },
  });
}

// ── Expenses ──

export function useExpenses(filters: ExpenseFilters = {}) {
  return useQuery({
    queryKey: ['finance', 'expenses', filters],
    queryFn: () => apiGet(`/api/finance/expenses${buildQuery(filters)}`),
  });
}

export function useExpense(id: string | null) {
  return useQuery({
    queryKey: ['finance', 'expenses', id],
    queryFn: () => apiGet(`/api/finance/expenses/${id}`),
    enabled: !!id,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPost('/api/finance/expenses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'expenses'] });
      queryClient.invalidateQueries({ queryKey: ['finance', 'stats'] });
    },
  });
}

export function useUpdateExpense(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPatch(`/api/finance/expenses/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'expenses'] });
      queryClient.invalidateQueries({ queryKey: ['finance', 'stats'] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/finance/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'expenses'] });
      queryClient.invalidateQueries({ queryKey: ['finance', 'stats'] });
    },
  });
}

export function useApproveExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, notes }: { id: string; action: 'approve' | 'reject'; notes?: string }) =>
      apiPost(`/api/finance/expenses/${id}/approve`, { action, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'expenses'] });
      queryClient.invalidateQueries({ queryKey: ['finance', 'stats'] });
    },
  });
}

// ── Payments ──

export function usePayments(filters: PaymentFilters = {}) {
  return useQuery({
    queryKey: ['finance', 'payments', filters],
    queryFn: () => apiGet(`/api/finance/payments${buildQuery(filters)}`),
  });
}

export function usePayment(id: string | null) {
  return useQuery({
    queryKey: ['finance', 'payments', id],
    queryFn: () => apiGet(`/api/finance/payments/${id}`),
    enabled: !!id,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPost('/api/finance/payments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'payments'] });
      queryClient.invalidateQueries({ queryKey: ['finance', 'invoices'] });
      queryClient.invalidateQueries({ queryKey: ['finance', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['finance', 'revenue'] });
    },
  });
}

// ── Revenue Analytics ──

export function useRevenue(period: string = '1y') {
  return useQuery({
    queryKey: ['finance', 'revenue', period],
    queryFn: () => apiGet(`/api/finance/revenue?period=${period}`),
  });
}

// ── Tax ──

export function useTax(year?: string, quarter?: string) {
  const params = new URLSearchParams();
  if (year) params.set('year', year);
  if (quarter) params.set('quarter', quarter);
  const query = params.toString();
  return useQuery({
    queryKey: ['finance', 'tax', year, quarter],
    queryFn: () => apiGet(`/api/finance/tax${query ? `?${query}` : ''}`),
  });
}

// ── Export ──

export function useExportFinance() {
  return useMutation({
    mutationFn: async (params: {
      type: 'invoices' | 'expenses' | 'payments';
      status?: string;
      from?: string;
      to?: string;
      format?: 'csv';
    }) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Get auth token
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch('/api/finance/export', {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: { message: 'Export failed' } }));
        throw new Error(err.error?.message ?? 'Export failed');
      }

      // Download the CSV
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const disposition = res.headers.get('Content-Disposition');
      const filename = disposition?.match(/filename="(.+)"/)?.[1] ?? `${params.type}_export.csv`;

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return { success: true };
    },
  });
}
