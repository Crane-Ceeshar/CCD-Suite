-- Tenant usage metrics table for billing/quota tracking
CREATE TABLE IF NOT EXISTS tenant_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  metric_name text NOT NULL,
  metric_value numeric NOT NULL DEFAULT 0,
  recorded_at timestamptz DEFAULT now()
);

CREATE INDEX idx_tenant_usage_tenant ON tenant_usage(tenant_id);
CREATE INDEX idx_tenant_usage_metric ON tenant_usage(tenant_id, metric_name);

ALTER TABLE tenant_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for tenant_usage"
  ON tenant_usage FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
