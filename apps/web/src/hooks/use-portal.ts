'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';

// ── Filter interfaces ──

interface PortalProjectFilters {
  search?: string;
  status?: string;
  client_id?: string;
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

// ── Portal Projects ──

export function usePortalProjects(filters: PortalProjectFilters = {}) {
  return useQuery({
    queryKey: ['portal', 'projects', filters],
    queryFn: () => apiGet(`/api/portal/projects${buildQuery(filters)}`),
  });
}

export function usePortalProject(id: string | null) {
  return useQuery({
    queryKey: ['portal', 'projects', 'detail', id],
    queryFn: () => apiGet(`/api/portal/projects/${id}`),
    enabled: !!id,
  });
}

export function useCreatePortalProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPost('/api/portal/projects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'projects'] });
    },
  });
}

export function useUpdatePortalProject(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPatch(`/api/portal/projects/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'projects'] });
    },
  });
}

export function useDeletePortalProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/portal/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'projects'] });
    },
  });
}

// ── Milestones ──

export function useMilestones(projectId: string | null) {
  return useQuery({
    queryKey: ['portal', 'milestones', projectId],
    queryFn: () => apiGet(`/api/portal/projects/${projectId}/milestones`),
    enabled: !!projectId,
  });
}

export function useCreateMilestone(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost(`/api/portal/projects/${projectId}/milestones`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'milestones', projectId] });
      queryClient.invalidateQueries({ queryKey: ['portal', 'projects'] });
    },
  });
}

export function useUpdateMilestone(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ milestoneId, data }: { milestoneId: string; data: Record<string, unknown> }) =>
      apiPatch(`/api/portal/projects/${projectId}/milestones/${milestoneId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'milestones', projectId] });
      queryClient.invalidateQueries({ queryKey: ['portal', 'projects'] });
    },
  });
}

export function useDeleteMilestone(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (milestoneId: string) =>
      apiDelete(`/api/portal/projects/${projectId}/milestones/${milestoneId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'milestones', projectId] });
      queryClient.invalidateQueries({ queryKey: ['portal', 'projects'] });
    },
  });
}

// ── Deliverables ──

export function useDeliverables(projectId: string | null) {
  return useQuery({
    queryKey: ['portal', 'deliverables', projectId],
    queryFn: () => apiGet(`/api/portal/projects/${projectId}/deliverables`),
    enabled: !!projectId,
  });
}

export function useCreateDeliverable(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost(`/api/portal/projects/${projectId}/deliverables`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'deliverables', projectId] });
    },
  });
}

export function useUpdateDeliverable(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ deliverableId, data }: { deliverableId: string; data: Record<string, unknown> }) =>
      apiPatch(`/api/portal/projects/${projectId}/deliverables/${deliverableId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'deliverables', projectId] });
    },
  });
}

export function useDeleteDeliverable(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deliverableId: string) =>
      apiDelete(`/api/portal/projects/${projectId}/deliverables/${deliverableId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'deliverables', projectId] });
    },
  });
}

// ── Messages ──

export function useMessages(projectId: string | null) {
  return useQuery({
    queryKey: ['portal', 'messages', projectId],
    queryFn: () => apiGet(`/api/portal/projects/${projectId}/messages`),
    enabled: !!projectId,
    refetchInterval: 30_000,
  });
}

export function useSendMessage(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost(`/api/portal/projects/${projectId}/messages`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'messages', projectId] });
    },
  });
}

export function useDeleteMessage(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) =>
      apiDelete(`/api/portal/projects/${projectId}/messages/${messageId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'messages', projectId] });
    },
  });
}

// ── Portal Dashboard ──

export function usePortalDashboard() {
  return useQuery({
    queryKey: ['portal', 'dashboard'],
    queryFn: () => apiGet('/api/portal/dashboard'),
  });
}

// ── Portal Notifications ──

export function usePortalNotifications() {
  return useQuery({
    queryKey: ['portal', 'notifications'],
    queryFn: () => apiGet('/api/portal/notifications'),
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPatch(`/api/portal/notifications/${id}`, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'notifications'] });
    },
  });
}
