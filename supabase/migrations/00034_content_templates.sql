-- Content templates table
CREATE TABLE IF NOT EXISTS content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('article', 'blog_post', 'social_post', 'email', 'landing_page', 'ad_copy', 'video_script')),
  body_template TEXT,
  metadata_template JSONB DEFAULT '{}',
  is_system BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE content_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_templates_tenant_select" ON content_templates
  FOR SELECT USING (
    tenant_id = get_current_tenant_id() OR is_system = true
  );

CREATE POLICY "content_templates_tenant_insert" ON content_templates
  FOR INSERT WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "content_templates_tenant_update" ON content_templates
  FOR UPDATE USING (tenant_id = get_current_tenant_id() AND is_system = false);

CREATE POLICY "content_templates_tenant_delete" ON content_templates
  FOR DELETE USING (tenant_id = get_current_tenant_id() AND is_system = false);

-- Indexes
CREATE INDEX idx_content_templates_tenant ON content_templates(tenant_id);
