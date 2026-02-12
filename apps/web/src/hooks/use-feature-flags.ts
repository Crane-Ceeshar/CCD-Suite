'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiGet } from '@/lib/api';

/**
 * React hook for consuming feature flags in client components.
 *
 * Fetches the resolved flags for the current tenant on mount.
 * Use `isEnabled(key)` to conditionally render features.
 *
 * @example
 * ```tsx
 * const { isEnabled, isLoading } = useFeatureFlags();
 * if (isEnabled('ai_chat_widget')) return <AIChatWidget />;
 * ```
 */
export function useFeatureFlags() {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiGet<Record<string, boolean>>('/api/feature-flags');
      setFlags(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feature flags');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isEnabled = useCallback(
    (key: string): boolean => flags[key] === true,
    [flags]
  );

  return { flags, isEnabled, isLoading, error, reload: load };
}
