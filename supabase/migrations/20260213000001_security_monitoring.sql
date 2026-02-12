-- ============================================================
-- Security Monitoring Schema
-- Adds: security_events, blocked_ips, security_scan_results
-- ============================================================

-- ── Enum Types ──────────────────────────────────────────────

CREATE TYPE security_event_type AS ENUM (
  'failed_login',
  'brute_force',
  'suspicious_request',
  'token_abuse',
  'rate_limit_exceeded',
  'unauthorized_access',
  'xss_attempt',
  'sql_injection_attempt'
);

CREATE TYPE security_severity AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TYPE security_scan_type AS ENUM ('headers', 'dependencies', 'permissions', 'rls', 'full');

CREATE TYPE security_scan_status AS ENUM ('running', 'completed', 'failed');

-- ============================================================
-- Security Events — log of detected security incidents
-- ============================================================

CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  event_type security_event_type NOT NULL,
  severity security_severity NOT NULL DEFAULT 'low',
  source_ip text,
  user_id uuid REFERENCES auth.users(id),
  user_agent text,
  endpoint text,
  details jsonb DEFAULT '{}'::jsonb,
  resolved boolean DEFAULT false,
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_security_events_tenant_created
  ON public.security_events (tenant_id, created_at DESC);
CREATE INDEX idx_security_events_event_type
  ON public.security_events (event_type);
CREATE INDEX idx_security_events_severity
  ON public.security_events (severity);
CREATE INDEX idx_security_events_source_ip
  ON public.security_events (source_ip);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Tenant-scoped read/write policies
CREATE POLICY "Tenant select for security_events"
  ON public.security_events FOR SELECT
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

CREATE POLICY "Tenant insert for security_events"
  ON public.security_events FOR INSERT
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

CREATE POLICY "Tenant update for security_events"
  ON public.security_events FOR UPDATE
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

CREATE POLICY "Tenant delete for security_events"
  ON public.security_events FOR DELETE
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

-- Public insert policy — allows security event logging from public/unauthenticated endpoints
CREATE POLICY "Allow public insert for security logging"
  ON public.security_events FOR INSERT
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.security_events TO authenticated;
GRANT INSERT ON public.security_events TO anon;

-- ============================================================
-- Blocked IPs — auto or manual IP blocklist per tenant
-- ============================================================

CREATE TABLE IF NOT EXISTS public.blocked_ips (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  ip_address text NOT NULL,
  reason text,
  blocked_by uuid REFERENCES auth.users(id),
  blocked_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true
);

-- Unique active block per tenant + IP
CREATE UNIQUE INDEX idx_blocked_ips_tenant_ip_active
  ON public.blocked_ips (tenant_id, ip_address) WHERE is_active = true;

-- Quick lookup of active blocks by IP across all tenants
CREATE INDEX idx_blocked_ips_ip_active
  ON public.blocked_ips (ip_address) WHERE is_active = true;

ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select for blocked_ips"
  ON public.blocked_ips FOR SELECT
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

CREATE POLICY "Tenant insert for blocked_ips"
  ON public.blocked_ips FOR INSERT
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

CREATE POLICY "Tenant update for blocked_ips"
  ON public.blocked_ips FOR UPDATE
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

CREATE POLICY "Tenant delete for blocked_ips"
  ON public.blocked_ips FOR DELETE
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.blocked_ips TO authenticated;

-- ============================================================
-- Security Scan Results — on-demand or scheduled security audits
-- ============================================================

CREATE TABLE IF NOT EXISTS public.security_scan_results (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  scan_type security_scan_type NOT NULL,
  status security_scan_status DEFAULT 'running',
  findings jsonb DEFAULT '[]'::jsonb,
  score integer CHECK (score >= 0 AND score <= 100),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  triggered_by uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_security_scan_results_tenant_started
  ON public.security_scan_results (tenant_id, started_at DESC);

ALTER TABLE public.security_scan_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select for security_scan_results"
  ON public.security_scan_results FOR SELECT
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

CREATE POLICY "Tenant insert for security_scan_results"
  ON public.security_scan_results FOR INSERT
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

CREATE POLICY "Tenant update for security_scan_results"
  ON public.security_scan_results FOR UPDATE
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

CREATE POLICY "Tenant delete for security_scan_results"
  ON public.security_scan_results FOR DELETE
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.security_scan_results TO authenticated;
