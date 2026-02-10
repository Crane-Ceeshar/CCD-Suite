'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';

interface ContentFilters {
  search?: string;
  status?: string;
  type?: string;
  category_id?: string;
  sort?: string;
  dir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export function useContentList(filters: ContentFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  const query = params.toString();

  return useQuery({
    queryKey: ['content', 'list', filters],
    queryFn: () => apiGet(`/api/content${query ? `?${query}` : ''}`),
  });
}

export function useContentStats() {
  return useQuery({
    queryKey: ['content', 'stats'],
    queryFn: () => apiGet('/api/content/stats'),
  });
}

export function useContentItem(id: string | null) {
  return useQuery({
    queryKey: ['content', 'item', id],
    queryFn: () => apiGet(`/api/content/${id}`),
    enabled: !!id,
  });
}

export function useContentCalendar(from: string, to: string) {
  return useQuery({
    queryKey: ['content', 'calendar', from, to],
    queryFn: () => apiGet(`/api/content/calendar?from=${from}&to=${to}`),
    enabled: !!from && !!to,
  });
}

export function useCreateContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPost('/api/content', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
    },
  });
}

export function useUpdateContent(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPatch(`/api/content/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
    },
  });
}

export function useDeleteContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/content/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
    },
  });
}
