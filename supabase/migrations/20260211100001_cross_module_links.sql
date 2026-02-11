-- Cross-module project links
CREATE TABLE IF NOT EXISTS public.project_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT ((current_setting('request.jwt.claims'::text, true))::json ->> 'tenant_id')::uuid,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  linked_entity_type text NOT NULL CHECK (linked_entity_type IN ('deal', 'content_item', 'seo_project')),
  linked_entity_id uuid NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, linked_entity_type, linked_entity_id)
);

ALTER TABLE public.project_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.project_links
  FOR ALL USING (tenant_id = ((current_setting('request.jwt.claims'::text, true))::json ->> 'tenant_id')::uuid);
