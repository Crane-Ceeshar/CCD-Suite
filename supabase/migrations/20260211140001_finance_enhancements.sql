-- ============================================================
-- Finance Enhancements Migration
-- ============================================================
-- Adds:
--   1. recurring_invoices table for automated invoice scheduling
--   2. credit_notes table for invoice adjustments/refunds
--   3. amount_paid column on invoices for partial payment tracking
--   4. RLS policies for new tables (tenant isolation)
--   5. Performance indexes for new tables and columns
--   6. updated_at trigger for recurring_invoices
-- ============================================================

-- ------------------------------------------------------------
-- 1. Recurring Invoices
-- ------------------------------------------------------------
create table public.recurring_invoices (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  template_invoice_id uuid references public.invoices(id) on delete set null,
  frequency text not null check (frequency in ('weekly', 'biweekly', 'monthly', 'quarterly', 'annually')),
  next_run_date date not null,
  end_date date,
  is_active boolean not null default true,
  auto_send boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger recurring_invoices_updated_at
  before update on public.recurring_invoices
  for each row execute function extensions.moddatetime(updated_at);

-- ------------------------------------------------------------
-- 2. Credit Notes
-- ------------------------------------------------------------
create table public.credit_notes (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  credit_number text not null,
  amount numeric(12,2) not null,
  reason text,
  status text not null default 'issued' check (status in ('draft', 'issued', 'applied', 'voided')),
  issued_date date not null default current_date,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3. Add amount_paid to invoices
-- ------------------------------------------------------------
-- Tracks partial payments; balance_due should be computed at
-- the application level as (total - amount_paid).
alter table public.invoices
  add column if not exists amount_paid numeric(12,2) not null default 0;

-- ------------------------------------------------------------
-- 4. RLS Policies
-- ------------------------------------------------------------
alter table public.recurring_invoices enable row level security;
alter table public.credit_notes enable row level security;

create policy "Tenant isolation for recurring_invoices"
  on public.recurring_invoices for all
  using (tenant_id = public.get_current_tenant_id());

create policy "Tenant isolation for credit_notes"
  on public.credit_notes for all
  using (tenant_id = public.get_current_tenant_id());

-- ------------------------------------------------------------
-- 5. Performance Indexes
-- ------------------------------------------------------------
create index if not exists idx_recurring_invoices_tenant
  on public.recurring_invoices (tenant_id);

create index if not exists idx_recurring_invoices_next_run
  on public.recurring_invoices (next_run_date)
  where is_active = true;

create index if not exists idx_recurring_invoices_template
  on public.recurring_invoices (template_invoice_id);

create index if not exists idx_credit_notes_tenant
  on public.credit_notes (tenant_id);

create index if not exists idx_credit_notes_invoice
  on public.credit_notes (invoice_id);

create unique index if not exists idx_credit_notes_number_tenant
  on public.credit_notes (tenant_id, credit_number);

create index if not exists idx_invoices_amount_paid
  on public.invoices (amount_paid)
  where amount_paid > 0;
