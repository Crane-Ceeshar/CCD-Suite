-- Analytics Goals table for tracking metric targets
CREATE TABLE IF NOT EXISTS analytics_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  metric_key text NOT NULL,
  target_value numeric NOT NULL,
  current_value numeric DEFAULT 0,
  unit text DEFAULT '',
  period text NOT NULL DEFAULT '30d',
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'missed', 'paused')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_analytics_goals_tenant ON analytics_goals(tenant_id);
CREATE INDEX idx_analytics_goals_status ON analytics_goals(tenant_id, status);

ALTER TABLE analytics_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for analytics_goals"
  ON analytics_goals FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
