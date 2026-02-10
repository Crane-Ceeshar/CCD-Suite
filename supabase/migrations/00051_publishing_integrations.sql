-- Publishing integrations and publish log tables
CREATE TABLE IF NOT EXISTS publishing_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('wordpress', 'medium', 'ghost', 'webflow')),
  name text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}',
  is_active boolean DEFAULT true,
  last_published_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS publish_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  content_item_id uuid NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  integration_id uuid NOT NULL REFERENCES publishing_integrations(id) ON DELETE CASCADE,
  external_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'failed')),
  error_message text,
  published_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_publishing_integrations_tenant ON publishing_integrations(tenant_id);
CREATE INDEX idx_publish_log_tenant ON publish_log(tenant_id);
CREATE INDEX idx_publish_log_content ON publish_log(content_item_id);

ALTER TABLE publishing_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE publish_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for publishing_integrations"
  ON publishing_integrations FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant isolation for publish_log"
  ON publish_log FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
