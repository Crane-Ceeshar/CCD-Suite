'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';

// ── Filter interfaces ──

interface SecurityEventFilters {
  severity?: string;
  event_type?: string;
  resolved?: string;
  from?: string;
  to?: string;
  per_page?: number;
  page?: number;
}

interface BlockedIpFilters {
  is_active?: string;
}

// ── Helper ──

function buildQuery(filters: object): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : '';
}

// ── Security Events ──

export function useSecurityEvents(filters: SecurityEventFilters = {}) {
  return useQuery({
    queryKey: ['security', 'events', filters],
    queryFn: () => apiGet(`/api/admin/security/events${buildQuery(filters)}`),
  });
}

export function useResolveEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      apiPatch(`/api/admin/security/events/${id}`, { resolved: true, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security', 'events'] });
      queryClient.invalidateQueries({ queryKey: ['security', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['security', 'score'] });
    },
  });
}

// ── Blocked IPs ──

export function useBlockedIps(filters: BlockedIpFilters = {}) {
  return useQuery({
    queryKey: ['security', 'blocked-ips', filters],
    queryFn: () => apiGet(`/api/admin/security/blocked-ips${buildQuery(filters)}`),
  });
}

export function useBlockIp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { ip_address: string; reason?: string; expires_at?: string }) =>
      apiPost('/api/admin/security/blocked-ips', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security', 'blocked-ips'] });
      queryClient.invalidateQueries({ queryKey: ['security', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['security', 'score'] });
    },
  });
}

export function useUpdateBlockedIp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; is_active?: boolean; expires_at?: string }) =>
      apiPatch(`/api/admin/security/blocked-ips/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security', 'blocked-ips'] });
      queryClient.invalidateQueries({ queryKey: ['security', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['security', 'score'] });
    },
  });
}

export function useUnblockIp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/admin/security/blocked-ips/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security', 'blocked-ips'] });
      queryClient.invalidateQueries({ queryKey: ['security', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['security', 'score'] });
    },
  });
}

// ── Security Scan ──

export function useRunSecurityScan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { scan_type: 'headers' | 'dependencies' | 'permissions' | 'rls' | 'full' }) =>
      apiPost('/api/admin/security/scan', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security', 'scans'] });
      queryClient.invalidateQueries({ queryKey: ['security', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['security', 'score'] });
    },
  });
}

export function useScanResult(id: string | null) {
  return useQuery({
    queryKey: ['security', 'scans', id],
    queryFn: () => apiGet(`/api/admin/security/scan/${id}`),
    enabled: !!id,
  });
}

export function useScanHistory() {
  return useQuery({
    queryKey: ['security', 'scans'],
    queryFn: () => apiGet('/api/admin/security/scan'),
  });
}

// ── Security Score ──

export function useSecurityScore() {
  return useQuery({
    queryKey: ['security', 'score'],
    queryFn: () => apiGet('/api/admin/security/score'),
  });
}

// ── Security Stats ──

export function useSecurityStats() {
  return useQuery({
    queryKey: ['security', 'stats'],
    queryFn: () => apiGet('/api/admin/security/stats'),
  });
}
