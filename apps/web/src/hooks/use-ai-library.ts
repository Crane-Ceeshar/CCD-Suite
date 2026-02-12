'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import type { AiContentLibraryItem } from '@ccd/shared';

// ============================================================
// Library List
// ============================================================

interface LibraryResponse {
  items: AiContentLibraryItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

interface UseAiLibraryOptions {
  search?: string;
  type?: string;
  favorites?: boolean;
  page?: number;
  limit?: number;
}

export function useAiLibrary(options?: UseAiLibraryOptions) {
  const [items, setItems] = useState<AiContentLibraryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (options?.search) params.set('search', options.search);
      if (options?.type) params.set('type', options.type);
      if (options?.favorites) params.set('favorites', 'true');
      if (options?.page) params.set('page', String(options.page));
      if (options?.limit) params.set('limit', String(options.limit));

      const qs = params.toString();
      const res = await apiGet<LibraryResponse>(`/api/ai/library${qs ? `?${qs}` : ''}`);
      setItems(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content library');
    } finally {
      setIsLoading(false);
    }
  }, [options?.search, options?.type, options?.favorites, options?.page, options?.limit]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, total, totalPages, isLoading, error, reload: load, setItems };
}

// ============================================================
// Save to Library
// ============================================================

export function useSaveToLibrary() {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(
    async (data: {
      title: string;
      content: string;
      type?: string;
      prompt?: string;
      tags?: string[];
      model?: string;
      tokens_used?: number;
      generation_job_id?: string;
      metadata?: Record<string, unknown>;
    }) => {
      setIsSaving(true);
      setError(null);
      try {
        const res = await apiPost<AiContentLibraryItem>('/api/ai/library', data);
        return res.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save content');
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  return { save, isSaving, error };
}

// ============================================================
// Toggle Favorite
// ============================================================

export function useToggleFavorite() {
  const [isToggling, setIsToggling] = useState<string | null>(null);

  const toggle = useCallback(async (id: string, isFavorite: boolean) => {
    setIsToggling(id);
    try {
      const res = await apiPatch<AiContentLibraryItem>(`/api/ai/library/${id}`, {
        is_favorite: isFavorite,
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

// ============================================================
// Delete Content Item
// ============================================================

export function useDeleteLibraryItem() {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const remove = useCallback(async (id: string) => {
    setIsDeleting(id);
    try {
      await apiDelete(`/api/ai/library/${id}`);
      return true;
    } catch {
      return false;
    } finally {
      setIsDeleting(null);
    }
  }, []);

  return { remove, isDeleting };
}
