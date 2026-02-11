'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';

// ── Filter interfaces ──

interface ProjectFilters {
  search?: string;
  status?: string;
  priority?: string;
  sort?: string;
  dir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

interface TaskFilters {
  search?: string;
  status?: string;
  priority?: string;
  assigned_to?: string;
  label?: string;
  sprint_id?: string;
  parent_id?: string;
  sort?: string;
  dir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

interface TimeEntryFilters {
  task_id?: string;
  user_id?: string;
  from?: string;
  to?: string;
  billable?: string;
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

// ── Projects ──

export function useProjects(filters: ProjectFilters = {}) {
  return useQuery({
    queryKey: ['projects', 'list', filters],
    queryFn: () => apiGet(`/api/projects${buildQuery(filters)}`),
  });
}

export function useProject(id: string | null) {
  return useQuery({
    queryKey: ['projects', 'detail', id],
    queryFn: () => apiGet(`/api/projects/${id}`),
    enabled: !!id,
  });
}

export function useProjectStats() {
  return useQuery({
    queryKey: ['projects', 'stats'],
    queryFn: () => apiGet('/api/projects/stats'),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPost('/api/projects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateProject(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPatch(`/api/projects/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

// ── Project Members ──

export function useProjectMembers(projectId: string | null) {
  return useQuery({
    queryKey: ['projects', 'members', projectId],
    queryFn: () => apiGet(`/api/projects/${projectId}/members`),
    enabled: !!projectId,
  });
}

export function useAddProjectMember(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { user_id: string; role?: string }) =>
      apiPost(`/api/projects/${projectId}/members`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', 'members', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'detail', projectId] });
    },
  });
}

export function useUpdateProjectMember(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      apiPatch(`/api/projects/${projectId}/members/${memberId}`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', 'members', projectId] });
    },
  });
}

export function useRemoveProjectMember(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) =>
      apiDelete(`/api/projects/${projectId}/members/${memberId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', 'members', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'detail', projectId] });
    },
  });
}

// ── Tasks ──

export function useTasks(projectId: string | null, filters: TaskFilters = {}) {
  return useQuery({
    queryKey: ['projects', 'tasks', projectId, filters],
    queryFn: () => apiGet(`/api/projects/${projectId}/tasks${buildQuery(filters)}`),
    enabled: !!projectId,
  });
}

export function useTask(projectId: string | null, taskId: string | null) {
  return useQuery({
    queryKey: ['projects', 'tasks', projectId, 'detail', taskId],
    queryFn: () => apiGet(`/api/projects/${projectId}/tasks/${taskId}`),
    enabled: !!projectId && !!taskId,
  });
}

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost(`/api/projects/${projectId}/tasks`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', 'tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'stats'] });
    },
  });
}

export function useUpdateTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: Record<string, unknown> }) =>
      apiPatch(`/api/projects/${projectId}/tasks/${taskId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', 'tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'stats'] });
    },
  });
}

export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) =>
      apiDelete(`/api/projects/${projectId}/tasks/${taskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', 'tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'stats'] });
    },
  });
}

export function useReorderTasks(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: { id: string; status?: string; position: number }[]) =>
      apiPost(`/api/projects/${projectId}/tasks/reorder`, { items }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', 'tasks', projectId] });
    },
  });
}

// ── Time Entries ──

export function useTimeEntries(projectId: string | null, filters: TimeEntryFilters = {}) {
  return useQuery({
    queryKey: ['projects', 'time-entries', projectId, filters],
    queryFn: () => apiGet(`/api/projects/${projectId}/time-entries${buildQuery(filters)}`),
    enabled: !!projectId,
  });
}

export function useRunningTimer(projectId: string | null) {
  return useQuery({
    queryKey: ['projects', 'time-entries', projectId, 'running'],
    queryFn: () => apiGet(`/api/projects/${projectId}/time-entries/running`),
    enabled: !!projectId,
    refetchInterval: 30_000,
  });
}

export function useCreateTimeEntry(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost(`/api/projects/${projectId}/time-entries`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', 'time-entries', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'stats'] });
    },
  });
}

export function useUpdateTimeEntry(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, data }: { entryId: string; data: Record<string, unknown> }) =>
      apiPatch(`/api/projects/${projectId}/time-entries/${entryId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', 'time-entries', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'stats'] });
    },
  });
}

export function useDeleteTimeEntry(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) =>
      apiDelete(`/api/projects/${projectId}/time-entries/${entryId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', 'time-entries', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'stats'] });
    },
  });
}

export function useTimesheet(projectId: string | null, from: string, to: string, groupBy = 'date') {
  return useQuery({
    queryKey: ['projects', 'timesheet', projectId, from, to, groupBy],
    queryFn: () => apiGet(`/api/projects/${projectId}/timesheet?from=${from}&to=${to}&group_by=${groupBy}`),
    enabled: !!projectId && !!from && !!to,
  });
}
