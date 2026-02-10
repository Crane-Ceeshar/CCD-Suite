-- Analytics reports table
CREATE TABLE IF NOT EXISTS analytics_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL CHECK (report_type IN ('performance', 'content', 'social', 'seo', 'custom')),
  config JSONB DEFAULT '{}',
  schedule JSONB,
  last_run_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE analytics_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analytics_reports_tenant_select" ON analytics_reports
  FOR SELECT USING (tenant_id = get_current_tenant_id());

CREATE POLICY "analytics_reports_tenant_insert" ON analytics_reports
  FOR INSERT WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "analytics_reports_tenant_update" ON analytics_reports
  FOR UPDATE USING (tenant_id = get_current_tenant_id());

CREATE POLICY "analytics_reports_tenant_delete" ON analytics_reports
  FOR DELETE USING (tenant_id = get_current_tenant_id());

-- Indexes
CREATE INDEX idx_analytics_reports_tenant ON analytics_reports(tenant_id);
