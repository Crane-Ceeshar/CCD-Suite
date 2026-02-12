-- Migration: AI Knowledge Base with pgvector
-- Phase 9: RAG / Knowledge Base for the CCD-Suite AI module

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- ============================================================
-- Knowledge base documents
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL DEFAULT 0,
  file_url text,
  status text NOT NULL DEFAULT 'pending',
  chunk_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_knowledge_base ENABLE ROW LEVEL SECURITY;

-- RLS: users can only access their tenant's documents
CREATE POLICY "Tenant members can view knowledge base docs"
  ON public.ai_knowledge_base FOR SELECT
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

CREATE POLICY "Tenant members can insert knowledge base docs"
  ON public.ai_knowledge_base FOR INSERT
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()) AND user_id = (SELECT auth.uid()));

CREATE POLICY "Tenant members can update knowledge base docs"
  ON public.ai_knowledge_base FOR UPDATE
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

CREATE POLICY "Tenant members can delete knowledge base docs"
  ON public.ai_knowledge_base FOR DELETE
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

-- Status check constraint
ALTER TABLE public.ai_knowledge_base
  ADD CONSTRAINT ai_knowledge_base_status_check
  CHECK (status IN ('pending', 'processing', 'ready', 'failed'));

-- ============================================================
-- Embeddings table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_base_id uuid NOT NULL REFERENCES public.ai_knowledge_base(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  content text NOT NULL,
  embedding extensions.vector(1536),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view embeddings"
  ON public.ai_embeddings FOR SELECT
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

CREATE POLICY "Tenant members can insert embeddings"
  ON public.ai_embeddings FOR INSERT
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

CREATE POLICY "Tenant members can delete embeddings"
  ON public.ai_embeddings FOR DELETE
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_ai_knowledge_base_tenant ON public.ai_knowledge_base (tenant_id);
CREATE INDEX idx_ai_knowledge_base_status ON public.ai_knowledge_base (status);
CREATE INDEX idx_ai_embeddings_kb ON public.ai_embeddings (knowledge_base_id);
CREATE INDEX idx_ai_embeddings_tenant ON public.ai_embeddings (tenant_id);

-- IVFFlat index for vector similarity (commented out — create after data is loaded)
-- Using cosine distance operator for similarity search
-- CREATE INDEX idx_ai_embeddings_vector ON public.ai_embeddings
--   USING ivfflat (embedding extensions.vector_cosine_ops)
--   WITH (lists = 100);

-- ============================================================
-- Match embeddings function for vector search
-- ============================================================
CREATE OR REPLACE FUNCTION public.match_ai_embeddings(
  query_embedding extensions.vector(1536),
  p_tenant_id uuid,
  match_count integer DEFAULT 5,
  match_threshold float DEFAULT 0.7
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float,
  knowledge_base_id uuid,
  metadata jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.content,
    1 - (e.embedding <=> query_embedding) AS similarity,
    e.knowledge_base_id,
    e.metadata
  FROM public.ai_embeddings e
  WHERE e.tenant_id = p_tenant_id
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================
-- Moddatetime trigger for updated_at
-- ============================================================
CREATE TRIGGER ai_knowledge_base_moddatetime
  BEFORE UPDATE ON public.ai_knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime(updated_at);
