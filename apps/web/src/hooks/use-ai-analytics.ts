'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiGet } from '@/lib/api';

interface DailyUsage {
  date: string;
  tokens: number;
}

interface TopUser {
  user_id: string;
  full_name: string;
  email: string;
  tokens: number;
  requests: number;
}

interface FeatureBreakdown {
  chat: number;
  generation: number;
  insights: number;
}

interface AnalyticsSummary {
  total_tokens: number;
  estimated_cost: number;
  active_users: number;
  budget_remaining: number;
}

export interface AiAnalytics {
  daily: DailyUsage[];
  top_users: TopUser[];
  feature_breakdown: FeatureBreakdown;
  summary: AnalyticsSummary;
}

export function useAiAnalytics() {
  const [analytics, setAnalytics] = useState<AiAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiGet<AiAnalytics>('/api/admin/ai/analytics');
      setAnalytics(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { analytics, isLoading, error, reload: load };
}
