'use client';

import { useState, useCallback, useRef } from 'react';
import { apiPost } from '@/lib/api';

interface UseAiGenerateOptions {
  type: string;
  module: 'social' | 'seo';
}

interface GenerateResult {
  result?: string;
  content?: string;
  model: string;
  tokens_used: number | null;
}

/**
 * Reusable React hook for AI content generation.
 * Calls the /api/ai/generate endpoint and logs activity to module context.
 */
export function useAiGenerate({ type, module }: UseAiGenerateOptions) {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  const generate = useCallback(
    async (prompt: string, context?: Record<string, unknown>) => {
      setGenerating(true);
      setResult('');
      setError(null);
      abortRef.current = false;

      try {
        const res = await apiPost<GenerateResult>('/api/ai/generate', {
          type,
          prompt,
          context: context ?? {},
        });

        if (abortRef.current) return;

        const content = res.data.result ?? res.data.content ?? '';
        setResult(content);

        // Log activity in background — fire and forget
        apiPost('/api/ai/module-context', {
          module,
          context_type: 'content_generated',
          context_data: {
            generation_type: type,
            prompt_length: prompt.length,
            result_length: content.length,
            model: res.data.model,
            tokens_used: res.data.tokens_used,
          },
        }).catch(() => {});

        return content;
      } catch {
        if (!abortRef.current) {
          setError(
            'AI service is not available. Please ensure the AI gateway is running.'
          );
        }
        return null;
      } finally {
        if (!abortRef.current) {
          setGenerating(false);
        }
      }
    },
    [type, module]
  );

  const reset = useCallback(() => {
    abortRef.current = true;
    setGenerating(false);
    setResult('');
    setError(null);
  }, []);

  return { generate, generating, result, error, reset };
}
