-- ============================================================
-- HR Enterprise Schema Enhancements
-- Adds: leave_balances, employee_documents, performance_reviews,
--        salary_history, leave_policies, public_holidays
-- ============================================================

-- ── Add updated_at to departments (missing from original schema) ──

ALTER TABLE public.departments
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'departments_updated_at'
  ) THEN
    CREATE TRIGGER departments_updated_at
      BEFORE UPDATE ON public.departments
      FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);
  END IF;
END $$;

-- ============================================================
-- Leave Balances — track remaining leave per type/year/employee
-- ============================================================

CREATE TABLE IF NOT EXISTS public.leave_balances (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type text NOT NULL CHECK (leave_type IN ('annual', 'sick', 'personal', 'maternity', 'paternity', 'unpaid')),
  year integer NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::integer,
  total_days numeric(5,1) NOT NULL DEFAULT 0,
  used_days numeric(5,1) NOT NULL DEFAULT 0,
  remaining_days numeric(5,1) GENERATED ALWAYS AS (total_days - used_days) STORED,
  carry_over_days numeric(5,1) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, leave_type, year)
);

CREATE TRIGGER leave_balances_updated_at
  BEFORE UPDATE ON public.leave_balances
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE INDEX idx_leave_balances_tenant ON public.leave_balances (tenant_id);
CREATE INDEX idx_leave_balances_employee_year ON public.leave_balances (employee_id, year);

ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for leave_balances"
  ON public.leave_balances FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

-- ============================================================
-- Employee Documents — metadata for offer letters, contracts, etc.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.employee_documents (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('offer_letter', 'contract', 'id_document', 'certification', 'tax_form', 'other')),
  file_url text,
  file_size integer,
  expiry_date date,
  notes text,
  uploaded_by uuid REFERENCES auth.users(id),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER employee_documents_updated_at
  BEFORE UPDATE ON public.employee_documents
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE INDEX idx_employee_documents_tenant ON public.employee_documents (tenant_id);
CREATE INDEX idx_employee_documents_employee ON public.employee_documents (employee_id);
CREATE INDEX idx_employee_documents_expiry ON public.employee_documents (expiry_date) WHERE expiry_date IS NOT NULL;

ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for employee_documents"
  ON public.employee_documents FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

-- ============================================================
-- Performance Reviews — annual/quarterly reviews with ratings
-- ============================================================

CREATE TABLE IF NOT EXISTS public.performance_reviews (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  review_period text NOT NULL,
  review_date date NOT NULL DEFAULT CURRENT_DATE,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  strengths text,
  areas_for_improvement text,
  goals text,
  overall_comments text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'acknowledged')),
  acknowledged_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER performance_reviews_updated_at
  BEFORE UPDATE ON public.performance_reviews
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE INDEX idx_performance_reviews_tenant ON public.performance_reviews (tenant_id);
CREATE INDEX idx_performance_reviews_employee ON public.performance_reviews (employee_id);
CREATE INDEX idx_performance_reviews_reviewer ON public.performance_reviews (reviewer_id);
CREATE INDEX idx_performance_reviews_status ON public.performance_reviews (status);

ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for performance_reviews"
  ON public.performance_reviews FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

-- ============================================================
-- Salary History — audit trail of salary changes
-- ============================================================

CREATE TABLE IF NOT EXISTS public.salary_history (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  previous_salary numeric(12,2),
  new_salary numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  reason text,
  changed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_salary_history_tenant ON public.salary_history (tenant_id);
CREATE INDEX idx_salary_history_employee ON public.salary_history (employee_id, effective_date);

ALTER TABLE public.salary_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for salary_history"
  ON public.salary_history FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

-- ============================================================
-- Leave Policies — configurable per employment type
-- ============================================================

CREATE TABLE IF NOT EXISTS public.leave_policies (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  employment_type text NOT NULL CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'intern', 'all')),
  leave_type text NOT NULL CHECK (leave_type IN ('annual', 'sick', 'personal', 'maternity', 'paternity', 'unpaid')),
  days_per_year numeric(5,1) NOT NULL DEFAULT 0,
  carry_over_max numeric(5,1) NOT NULL DEFAULT 0,
  requires_approval boolean NOT NULL DEFAULT true,
  min_notice_days integer NOT NULL DEFAULT 0,
  max_consecutive_days integer,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER leave_policies_updated_at
  BEFORE UPDATE ON public.leave_policies
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE INDEX idx_leave_policies_tenant ON public.leave_policies (tenant_id);
CREATE INDEX idx_leave_policies_active ON public.leave_policies (tenant_id, is_active) WHERE is_active = true;

ALTER TABLE public.leave_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for leave_policies"
  ON public.leave_policies FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

-- ============================================================
-- Public Holidays — per-region holiday calendar
-- ============================================================

CREATE TABLE IF NOT EXISTS public.public_holidays (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  date date NOT NULL,
  region text NOT NULL DEFAULT 'all',
  is_recurring boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_public_holidays_tenant_date ON public.public_holidays (tenant_id, date);
CREATE INDEX idx_public_holidays_region ON public.public_holidays (tenant_id, region);

ALTER TABLE public.public_holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for public_holidays"
  ON public.public_holidays FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

-- ============================================================
-- Additional indexes for existing HR tables (performance)
-- ============================================================

-- Composite index for leave date range queries
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates
  ON public.leave_requests (tenant_id, start_date, end_date);

-- Composite index for attendance date range queries
CREATE INDEX IF NOT EXISTS idx_attendance_tenant_date
  ON public.attendance_records (tenant_id, date);

-- Index for payroll period queries
CREATE INDEX IF NOT EXISTS idx_payroll_runs_period
  ON public.payroll_runs (tenant_id, period_start, period_end);

-- Index for employee name search
CREATE INDEX IF NOT EXISTS idx_employees_name
  ON public.employees (tenant_id, last_name, first_name);

-- Index for payroll items employee lookup
CREATE INDEX IF NOT EXISTS idx_payroll_items_employee
  ON public.payroll_items (employee_id);

-- ============================================================
-- Grant permissions to authenticated role
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.leave_balances TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.performance_reviews TO authenticated;
GRANT SELECT, INSERT ON public.salary_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leave_policies TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.public_holidays TO authenticated;
