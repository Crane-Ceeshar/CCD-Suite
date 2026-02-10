'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api';

export function useAnalyticsOverview(period: string) {
  return useQuery({
    queryKey: ['analytics', 'overview', period],
    queryFn: () => apiGet(`/api/analytics/overview?period=${period}`),
  });
}

export function useAnalyticsTrends(period: string, metric: string = 'all') {
  return useQuery({
    queryKey: ['analytics', 'trends', period, metric],
    queryFn: () => apiGet(`/api/analytics/trends?period=${period}&metric=${metric}`),
  });
}

export function useInsights(period: string) {
  return useMutation({
    mutationFn: (moduleContext?: string) =>
      apiPost('/api/analytics/insights', { period, moduleContext }),
  });
}
