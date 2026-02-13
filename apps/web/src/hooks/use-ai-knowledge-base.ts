'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';
import type { AiKnowledgeBaseDoc } from '@ccd/shared';

// ============================================================
// List Knowledge Base Documents
// ============================================================

interface KnowledgeBaseListResponse {
  documents: AiKnowledgeBaseDoc[];
  total: number;
}

export function useKnowledgeBase(statusFilter?: string) {
  const [documents, setDocuments] = useState<AiKnowledgeBaseDoc[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      const res = await apiGet<KnowledgeBaseListResponse>(
        `/api/ai/knowledge-base?${params.toString()}`
      );
      setDocuments(res.data.documents);
      setTotal(res.data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load knowledge base');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  return { documents, total, isLoading, error, reload: load, setDocuments };
}

// ============================================================
// Upload Document
// ============================================================

export function useUploadDocument() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File, title: string, description?: string) => {
    setIsUploading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Get user session for tenant context
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Check storage quota before uploading
      const storageRes = await apiGet<{ usedBytes: number; limitGb: number; usedGb: number }>(
        '/api/settings/storage'
      );
      const limitBytes = storageRes.data.limitGb * 1024 * 1024 * 1024;
      if (storageRes.data.usedBytes + file.size > limitBytes) {
        throw new Error(
          `Storage quota exceeded. Using ${storageRes.data.usedGb} GB of ${storageRes.data.limitGb} GB. Upgrade your plan for more storage.`
        );
      }

      // Upload file to Supabase Storage
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${timestamp}_${safeName}`;

      const { error: uploadErr } = await supabase.storage
        .from('knowledge-base')
        .upload(storagePath, file, {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
        });

      if (uploadErr) {
        throw new Error(`File upload failed: ${uploadErr.message}`);
      }

      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('knowledge-base')
        .getPublicUrl(storagePath);

      const fileUrl = urlData.publicUrl;

      // Create the knowledge base record
      const res = await apiPost<AiKnowledgeBaseDoc>('/api/ai/knowledge-base', {
        title: title.trim(),
        description: description?.trim() ?? '',
        file_name: file.name,
        file_type: file.type || 'text/plain',
        file_size: file.size,
        file_url: fileUrl,
      });

      // Trigger processing (fire and forget — edge function will handle it)
      try {
        await supabase.functions.invoke('process-knowledge-base', {
          body: { knowledge_base_id: res.data.id },
        });
      } catch {
        // Processing will be retried or handled separately
        console.warn('Failed to trigger document processing');
      }

      return res.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return { upload, isUploading, error, reset };
}

// ============================================================
// Delete Document
// ============================================================

export function useDeleteDocument() {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const remove = useCallback(async (id: string) => {
    setIsDeleting(id);
    try {
      await apiDelete(`/api/ai/knowledge-base/${id}`);
      return true;
    } catch {
      return false;
    } finally {
      setIsDeleting(null);
    }
  }, []);

  return { remove, isDeleting };
}

// ============================================================
// Search Knowledge Base
// ============================================================

interface SearchResult {
  id: string;
  content: string;
  similarity: number;
  knowledge_base_id: string;
  metadata: Record<string, unknown>;
}

interface SearchResponse {
  results: SearchResult[];
  query: string;
}

export function useSearchKnowledgeBase() {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, count?: number, threshold?: number) => {
    setIsSearching(true);
    setResults([]);
    setError(null);

    try {
      const res = await apiPost<SearchResponse>('/api/ai/knowledge-base/search', {
        query,
        count: count ?? 5,
        threshold: threshold ?? 0.7,
      });
      setResults(res.data.results);
      return res.data.results;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
      return null;
    } finally {
      setIsSearching(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return { search, isSearching, results, error, reset };
}
