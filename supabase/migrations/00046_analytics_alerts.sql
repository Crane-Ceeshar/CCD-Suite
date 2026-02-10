-- Analytics Alerts table for threshold-based notifications
CREATE TABLE IF NOT EXISTS analytics_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  metric_key text NOT NULL,
  condition text NOT NULL CHECK (condition IN ('above', 'below', 'equals', 'change_pct')),
  threshold numeric NOT NULL,
  channel text NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'webhook', 'in_app')),
  webhook_url text,
  email_recipients text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  last_triggered_at timestamptz,
  last_value numeric,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_analytics_alerts_tenant ON analytics_alerts(tenant_id);
CREATE INDEX idx_analytics_alerts_active ON analytics_alerts(tenant_id, is_active) WHERE is_active = true;

ALTER TABLE analytics_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for analytics_alerts"
  ON analytics_alerts FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
