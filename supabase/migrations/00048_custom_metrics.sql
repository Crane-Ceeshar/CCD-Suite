-- Custom calculated metrics table
CREATE TABLE IF NOT EXISTS custom_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  formula text NOT NULL,
  unit text DEFAULT '',
  format text DEFAULT 'number' CHECK (format IN ('number', 'currency', 'percentage', 'decimal')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_custom_metrics_tenant ON custom_metrics(tenant_id);

ALTER TABLE custom_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for custom_metrics"
  ON custom_metrics FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
