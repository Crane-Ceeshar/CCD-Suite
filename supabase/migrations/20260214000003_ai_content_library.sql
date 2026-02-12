-- Phase 6: AI Content Library — save, browse, favourite, tag, and search generated content
CREATE TABLE IF NOT EXISTS public.ai_content_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'custom',
  title text NOT NULL,
  content text NOT NULL,
  prompt text DEFAULT '',
  is_favorite boolean NOT NULL DEFAULT false,
  tags text[] DEFAULT '{}',
  model text,
  tokens_used integer,
  generation_job_id uuid REFERENCES public.ai_generation_jobs(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_content_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own content in tenant"
  ON public.ai_content_library FOR SELECT
  USING (
    tenant_id = (SELECT public.get_current_tenant_id())
    AND user_id = (SELECT auth.uid())
  );

CREATE POLICY "Users can insert their own content"
  ON public.ai_content_library FOR INSERT
  WITH CHECK (
    tenant_id = (SELECT public.get_current_tenant_id())
    AND user_id = (SELECT auth.uid())
  );

CREATE POLICY "Users can update their own content"
  ON public.ai_content_library FOR UPDATE
  USING (
    tenant_id = (SELECT public.get_current_tenant_id())
    AND user_id = (SELECT auth.uid())
  );

CREATE POLICY "Users can delete their own content"
  ON public.ai_content_library FOR DELETE
  USING (
    tenant_id = (SELECT public.get_current_tenant_id())
    AND user_id = (SELECT auth.uid())
  );

CREATE INDEX idx_ai_content_library_tenant ON public.ai_content_library (tenant_id);
CREATE INDEX idx_ai_content_library_user ON public.ai_content_library (user_id);
CREATE INDEX idx_ai_content_library_type ON public.ai_content_library (type);
CREATE INDEX idx_ai_content_library_favorite ON public.ai_content_library (is_favorite) WHERE is_favorite = true;

CREATE TRIGGER set_ai_content_library_updated_at
  BEFORE UPDATE ON public.ai_content_library
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime(updated_at);
