'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';

// ── Filter interfaces ──

interface EmployeeFilters {
  search?: string;
  status?: string;
  department_id?: string;
  employment_type?: string;
  sort?: string;
  dir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

interface DepartmentFilters {
  search?: string;
  sort?: string;
  dir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

interface LeaveFilters {
  employee_id?: string;
  status?: string;
  leave_type?: string;
  from?: string;
  to?: string;
  sort?: string;
  dir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

interface AttendanceFilters {
  employee_id?: string;
  from?: string;
  to?: string;
  sort?: string;
  dir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

interface PayrollFilters {
  status?: string;
  period?: string;
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

export function useHrStats() {
  return useQuery({
    queryKey: ['hr', 'stats'],
    queryFn: () => apiGet('/api/hr/stats'),
  });
}

// ── Employees ──

export function useEmployees(filters: EmployeeFilters = {}) {
  return useQuery({
    queryKey: ['hr', 'employees', filters],
    queryFn: () => apiGet(`/api/hr/employees${buildQuery(filters)}`),
  });
}

export function useEmployee(id: string | null) {
  return useQuery({
    queryKey: ['hr', 'employees', id],
    queryFn: () => apiGet(`/api/hr/employees/${id}`),
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPost('/api/hr/employees', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'employees'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'stats'] });
    },
  });
}

export function useUpdateEmployee(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPatch(`/api/hr/employees/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'employees'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'stats'] });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPatch(`/api/hr/employees/${id}`, { status: 'inactive' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'employees'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'stats'] });
    },
  });
}

// ── Departments ──

export function useDepartments(filters: DepartmentFilters = {}) {
  return useQuery({
    queryKey: ['hr', 'departments', filters],
    queryFn: () => apiGet(`/api/hr/departments${buildQuery(filters)}`),
  });
}

export function useDepartment(id: string | null) {
  return useQuery({
    queryKey: ['hr', 'departments', id],
    queryFn: () => apiGet(`/api/hr/departments/${id}`),
    enabled: !!id,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPost('/api/hr/departments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'departments'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'stats'] });
    },
  });
}

export function useUpdateDepartment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPatch(`/api/hr/departments/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'departments'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'stats'] });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/hr/departments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'departments'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'stats'] });
    },
  });
}

// ── Leave Requests ──

export function useLeaveRequests(filters: LeaveFilters = {}) {
  return useQuery({
    queryKey: ['hr', 'leave', filters],
    queryFn: () => apiGet(`/api/hr/leave${buildQuery(filters)}`),
  });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPost('/api/hr/leave', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'leave'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'stats'] });
    },
  });
}

export function useApproveLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, notes }: { id: string; action: 'approve' | 'reject'; notes?: string }) =>
      apiPost(`/api/hr/leave/${id}/approve`, { action, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'leave'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'employees'] });
    },
  });
}

// ── Attendance ──

export function useAttendance(filters: AttendanceFilters = {}) {
  return useQuery({
    queryKey: ['hr', 'attendance', filters],
    queryFn: () => apiGet(`/api/hr/attendance${buildQuery(filters)}`),
  });
}

export function useCreateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPost('/api/hr/attendance', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'attendance'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'stats'] });
    },
  });
}

export function useUpdateAttendance(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPatch(`/api/hr/attendance/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'attendance'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'stats'] });
    },
  });
}

// ── Payroll ──

export function usePayrollRuns(filters: PayrollFilters = {}) {
  return useQuery({
    queryKey: ['hr', 'payroll', filters],
    queryFn: () => apiGet(`/api/hr/payroll${buildQuery(filters)}`),
  });
}

export function usePayrollRun(id: string | null) {
  return useQuery({
    queryKey: ['hr', 'payroll', id],
    queryFn: () => apiGet(`/api/hr/payroll/${id}`),
    enabled: !!id,
  });
}

export function useCreatePayrollRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPost('/api/hr/payroll', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'payroll'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'stats'] });
    },
  });
}

export function useProcessPayroll(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPost(`/api/hr/payroll/${id}/process`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'payroll'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'stats'] });
    },
  });
}

// ── Leave Balances ──

export function useLeaveBalances(employeeId: string | null, year?: number) {
  const params = new URLSearchParams();
  if (year) params.set('year', String(year));
  const query = params.toString();
  return useQuery({
    queryKey: ['hr', 'leave-balances', employeeId, year],
    queryFn: () => apiGet(`/api/hr/employees/${employeeId}/leave-balances${query ? `?${query}` : ''}`),
    enabled: !!employeeId,
  });
}

export function useUpdateLeaveBalance(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPatch(`/api/hr/leave-balances/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'leave-balances'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'stats'] });
    },
  });
}

// ── Documents ──

export function useEmployeeDocuments(employeeId: string | null) {
  return useQuery({
    queryKey: ['hr', 'documents', employeeId],
    queryFn: () => apiGet(`/api/hr/employees/${employeeId}/documents`),
    enabled: !!employeeId,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPost('/api/hr/documents', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'documents'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'stats'] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/hr/documents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'documents'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'stats'] });
    },
  });
}

// ── Performance Reviews ──

export function usePerformanceReviews(filters: EmployeeFilters = {}) {
  return useQuery({
    queryKey: ['hr', 'performance-reviews', filters],
    queryFn: () => apiGet(`/api/hr/performance-reviews${buildQuery(filters)}`),
  });
}

export function usePerformanceReview(id: string | null) {
  return useQuery({
    queryKey: ['hr', 'performance-reviews', id],
    queryFn: () => apiGet(`/api/hr/performance-reviews/${id}`),
    enabled: !!id,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPost('/api/hr/performance-reviews', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'performance-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'stats'] });
    },
  });
}

export function useUpdateReview(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPatch(`/api/hr/performance-reviews/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'performance-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'stats'] });
    },
  });
}

// ── Salary History ──

export function useSalaryHistory(employeeId: string | null) {
  return useQuery({
    queryKey: ['hr', 'salary-history', employeeId],
    queryFn: () => apiGet(`/api/hr/employees/${employeeId}/salary-history`),
    enabled: !!employeeId,
  });
}

// ── Leave Policies ──

export function useLeavePolicies() {
  return useQuery({
    queryKey: ['hr', 'leave-policies'],
    queryFn: () => apiGet('/api/hr/leave-policies'),
  });
}

export function useCreateLeavePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPost('/api/hr/leave-policies', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'leave-policies'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'stats'] });
    },
  });
}

export function useUpdateLeavePolicy(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPatch(`/api/hr/leave-policies/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'leave-policies'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'stats'] });
    },
  });
}

export function useDeleteLeavePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/hr/leave-policies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'leave-policies'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'stats'] });
    },
  });
}

// ── Public Holidays ──

export function usePublicHolidays(year?: number) {
  const params = new URLSearchParams();
  if (year) params.set('year', String(year));
  const query = params.toString();
  return useQuery({
    queryKey: ['hr', 'public-holidays', year],
    queryFn: () => apiGet(`/api/hr/public-holidays${query ? `?${query}` : ''}`),
  });
}

export function useCreateHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPost('/api/hr/public-holidays', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'public-holidays'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'stats'] });
    },
  });
}

export function useDeleteHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/hr/public-holidays/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'public-holidays'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'stats'] });
    },
  });
}

// ── Export ──

export function useExportHr() {
  return useMutation({
    mutationFn: async (params: {
      type: 'employees' | 'attendance' | 'leave' | 'payroll';
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

      const res = await fetch('/api/hr/export', {
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

// ── Contracts ──

interface ContractFilters {
  employee_id?: string;
  status?: string;
  type?: string;
  search?: string;
  sort?: string;
  dir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export function useContracts(filters: ContractFilters = {}) {
  return useQuery({
    queryKey: ['hr', 'contracts', filters],
    queryFn: () => apiGet(`/api/hr/contracts${buildQuery(filters)}`),
  });
}

export function useContract(id: string | null) {
  return useQuery({
    queryKey: ['hr', 'contracts', id],
    queryFn: () => apiGet(`/api/hr/contracts/${id}`),
    enabled: !!id,
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPost('/api/hr/contracts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'contracts'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'stats'] });
    },
  });
}

export function useUpdateContract(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPatch(`/api/hr/contracts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'contracts'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'stats'] });
    },
  });
}

export function useDeleteContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/hr/contracts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'contracts'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'stats'] });
    },
  });
}

export function useSendContract(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPost(`/api/hr/contracts/${id}/send`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'contracts'] });
    },
  });
}

export function useUploadContractFile(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const headers: Record<string, string> = {};
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`/api/hr/contracts/${id}/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: { message: 'Upload failed' } }));
        throw new Error(err.error?.message ?? 'Upload failed');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'contracts'] });
    },
  });
}

// ── Contract Templates ──

interface TemplateFilters {
  search?: string;
  is_active?: string;
  sort?: string;
  dir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export function useContractTemplates(filters: TemplateFilters = {}) {
  return useQuery({
    queryKey: ['hr', 'contract-templates', filters],
    queryFn: () => apiGet(`/api/hr/contract-templates${buildQuery(filters)}`),
  });
}

export function useContractTemplate(id: string | null) {
  return useQuery({
    queryKey: ['hr', 'contract-templates', id],
    queryFn: () => apiGet(`/api/hr/contract-templates/${id}`),
    enabled: !!id,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPost('/api/hr/contract-templates', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'contract-templates'] });
    },
  });
}

export function useUpdateTemplate(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPatch(`/api/hr/contract-templates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'contract-templates'] });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/hr/contract-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'contract-templates'] });
    },
  });
}

// ── Self-Service Leave Forms ──

export function useSendLeaveForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPost('/api/hr/leave/send-form', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'leave'] });
    },
  });
}
