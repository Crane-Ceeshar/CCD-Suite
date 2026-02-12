-- ============================================================
-- HR Contracts & Self-Service Schema
-- Adds: contract_templates, contracts, document_signatures,
--        hr_form_tokens
-- ============================================================

-- ============================================================
-- Contract Templates — reusable contract blueprints
-- ============================================================

CREATE TABLE IF NOT EXISTS public.contract_templates (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  content jsonb NOT NULL DEFAULT '[]'::jsonb,  -- array of sections/clauses
  variables jsonb NOT NULL DEFAULT '[]'::jsonb, -- placeholder definitions
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER contract_templates_updated_at
  BEFORE UPDATE ON public.contract_templates
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE INDEX idx_contract_templates_tenant ON public.contract_templates (tenant_id);
CREATE INDEX idx_contract_templates_active ON public.contract_templates (tenant_id, is_active);

ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for contract_templates"
  ON public.contract_templates FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_templates TO authenticated;

-- ============================================================
-- Contracts — employee contracts with lifecycle tracking
-- ============================================================

CREATE TABLE IF NOT EXISTS public.contracts (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.contract_templates(id) ON DELETE SET NULL,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'employment' CHECK (type IN ('employment', 'nda', 'amendment', 'other')),
  content jsonb NOT NULL DEFAULT '[]'::jsonb,  -- rendered sections
  file_url text,  -- uploaded PDF path in storage
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'signed', 'expired', 'cancelled')),
  sent_at timestamptz,
  viewed_at timestamptz,
  signed_at timestamptz,
  expires_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE INDEX idx_contracts_tenant ON public.contracts (tenant_id);
CREATE INDEX idx_contracts_employee ON public.contracts (employee_id);
CREATE INDEX idx_contracts_status ON public.contracts (status);
CREATE INDEX idx_contracts_tenant_status ON public.contracts (tenant_id, status);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for contracts"
  ON public.contracts FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contracts TO authenticated;

-- ============================================================
-- Document Signatures — immutable signature records
-- ============================================================

CREATE TABLE IF NOT EXISTS public.document_signatures (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  signer_employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  signature_data text NOT NULL,  -- base64 PNG from canvas
  signature_method text NOT NULL CHECK (signature_method IN ('draw', 'type')),
  typed_name text,
  ip_address text,
  signed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_document_signatures_contract ON public.document_signatures (contract_id);

ALTER TABLE public.document_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for document_signatures"
  ON public.document_signatures FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

GRANT SELECT, INSERT ON public.document_signatures TO authenticated;

-- ============================================================
-- HR Form Tokens — self-service tokenised access
-- ============================================================

CREATE TABLE IF NOT EXISTS public.hr_form_tokens (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  token_type text NOT NULL CHECK (token_type IN ('leave_request', 'contract_signing', 'document_upload')),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_hr_form_tokens_employee ON public.hr_form_tokens (employee_id);

ALTER TABLE public.hr_form_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for hr_form_tokens"
  ON public.hr_form_tokens FOR ALL
  TO authenticated
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

CREATE POLICY "Public token verification"
  ON public.hr_form_tokens FOR SELECT
  TO anon
  USING (true);

GRANT SELECT, INSERT, UPDATE ON public.hr_form_tokens TO authenticated;
GRANT SELECT ON public.hr_form_tokens TO anon;
