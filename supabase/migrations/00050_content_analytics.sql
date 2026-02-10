-- Content analytics tracking table
CREATE TABLE IF NOT EXISTS content_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  content_item_id uuid NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  views integer DEFAULT 0,
  unique_views integer DEFAULT 0,
  avg_time_seconds numeric DEFAULT 0,
  engagement_score numeric DEFAULT 0,
  bounce_rate numeric DEFAULT 0,
  recorded_at timestamptz DEFAULT now()
);

CREATE INDEX idx_content_analytics_item ON content_analytics(content_item_id);
CREATE INDEX idx_content_analytics_tenant ON content_analytics(tenant_id);
CREATE INDEX idx_content_analytics_date ON content_analytics(content_item_id, recorded_at);

ALTER TABLE content_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for content_analytics"
  ON content_analytics FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
