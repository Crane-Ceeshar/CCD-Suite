'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import type {
  AiConversation,
  AiInsight,
  AiAutomation,
  AiAutomationRun,
  AiSettings,
} from '@ccd/shared';

// ============================================================
// Dashboard Stats
// ============================================================

interface AiStats {
  conversations: number;
  content_generated: number;
  insights: number;
  unread_insights: number;
  automations_active: number;
  recent_conversations: { id: string; title: string | null; module_context: string | null; updated_at: string }[];
  recent_jobs: { id: string; type: string; status: string; created_at: string }[];
  token_usage: { budget: number; used: number };
  features_enabled: Record<string, boolean>;
}

export function useAiStats() {
  const [stats, setStats] = useState<AiStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiGet<AiStats>('/api/ai/stats');
      setStats(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { stats, isLoading, error, reload: load };
}

// ============================================================
// Insights
// ============================================================

interface InsightsResponse {
  insights: AiInsight[];
  total: number;
}

export function useAiInsights(category?: string) {
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (cat?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      const effectiveCategory = cat ?? category;
      if (effectiveCategory && effectiveCategory !== 'all') {
        params.set('category', effectiveCategory);
      }
      const res = await apiGet<InsightsResponse>(`/api/ai/insights?${params.toString()}`);
      setInsights(res.data.insights);
      setTotal(res.data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  useEffect(() => {
    load();
  }, [load]);

  return { insights, total, isLoading, error, reload: load };
}

export function useGenerateInsights() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (category: string) => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await apiPost<AiInsight[]>('/api/ai/insights', {
        category: category === 'all' ? 'crm' : category,
      });
      return res.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate insights');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { generate, isGenerating, error };
}

export function useMarkInsightRead() {
  const markRead = useCallback(async (id: string, isRead = true) => {
    try {
      await apiPatch(`/api/ai/insights/${id}`, { is_read: isRead });
      return true;
    } catch {
      return false;
    }
  }, []);

  return { markRead };
}

// ============================================================
// Automations
// ============================================================

export function useAiAutomations() {
  const [automations, setAutomations] = useState<AiAutomation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiGet<AiAutomation[]>('/api/ai/automations');
      setAutomations(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load automations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { automations, isLoading, error, reload: load, setAutomations };
}

export function useToggleAutomation() {
  const [isToggling, setIsToggling] = useState<string | null>(null);

  const toggle = useCallback(async (id: string, isEnabled: boolean) => {
    setIsToggling(id);
    try {
      const res = await apiPatch<AiAutomation>(`/api/ai/automations/${id}`, {
        is_enabled: isEnabled,
      });
      return res.data;
    } catch {
      return null;
    } finally {
      setIsToggling(null);
    }
  }, []);

  return { toggle, isToggling };
}

export function useCreateAutomation() {
  const [isCreating, setIsCreating] = useState(false);

  const create = useCallback(
    async (data: { type: string; name: string; description?: string; config?: Record<string, unknown>; is_enabled?: boolean }) => {
      setIsCreating(true);
      try {
        const res = await apiPost<AiAutomation>('/api/ai/automations', data);
        return res.data;
      } catch {
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    []
  );

  return { create, isCreating };
}

// ============================================================
// Automation Runs
// ============================================================

export function useAutomationRuns(automationId: string | null) {
  const [runs, setRuns] = useState<AiAutomationRun[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!automationId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiGet<{ runs: AiAutomationRun[]; total: number }>(
        `/api/ai/automations/${automationId}/runs?limit=5`
      );
      setRuns(res.data.runs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load runs');
    } finally {
      setIsLoading(false);
    }
  }, [automationId]);

  useEffect(() => {
    load();
  }, [load]);

  return { runs, isLoading, error, reload: load };
}

export function useTriggerRun() {
  const [isTriggering, setIsTriggering] = useState<string | null>(null);

  const trigger = useCallback(async (automationId: string) => {
    setIsTriggering(automationId);
    try {
      const res = await apiPost<{ run: AiAutomationRun }>(
        `/api/ai/automations/${automationId}/run`,
        {}
      );
      return res.data.run;
    } catch {
      return null;
    } finally {
      setIsTriggering(null);
    }
  }, []);

  return { trigger, isTriggering };
}

// ============================================================
// Settings
// ============================================================

export function useAiSettings() {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiGet<AiSettings | null>('/api/admin/settings/ai');
      setSettings(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(async (updates: Partial<AiSettings>) => {
    try {
      const res = await apiPatch<AiSettings>('/api/admin/settings/ai', updates);
      setSettings(res.data);
      return res.data;
    } catch {
      return null;
    }
  }, []);

  return { settings, isLoading, error, save, reload: load };
}

// ============================================================
// Analyze Text
// ============================================================

interface AnalyzeResult {
  results: Record<string, unknown>;
  model: string;
  tokens_used: number | null;
}

export function useAiAnalyze() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(
    async (text: string, analyses: string[], context?: Record<string, unknown>) => {
      setIsAnalyzing(true);
      setResult(null);
      setError(null);
      try {
        const res = await apiPost<AnalyzeResult>('/api/ai/analyze', {
          text,
          analyses,
          context,
        });
        setResult(res.data);
        return res.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Analysis failed');
        return null;
      } finally {
        setIsAnalyzing(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { analyze, isAnalyzing, result, error, reset };
}
