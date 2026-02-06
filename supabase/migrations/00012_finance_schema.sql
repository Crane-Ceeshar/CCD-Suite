-- ============================================================
-- Finance Module Schema
-- ============================================================

-- Invoices
create table public.invoices (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  invoice_number text not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  issue_date date not null default current_date,
  due_date date,
  subtotal numeric(12,2) not null default 0,
  tax_rate numeric(5,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  currency text not null default 'USD',
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger invoices_updated_at
  before update on public.invoices
  for each row execute function extensions.moddatetime(updated_at);

create unique index idx_invoices_number_tenant on public.invoices (tenant_id, invoice_number);
create index idx_invoices_tenant on public.invoices (tenant_id);
create index idx_invoices_status on public.invoices (status);
create index idx_invoices_company on public.invoices (company_id);
create index idx_invoices_contact on public.invoices (contact_id);
alter table public.invoices enable row level security;

-- Invoice Items (line items)
create table public.invoice_items (
  id uuid primary key default extensions.uuid_generate_v4(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  amount numeric(12,2) not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_invoice_items_invoice on public.invoice_items (invoice_id);
alter table public.invoice_items enable row level security;

-- Expenses
create table public.expenses (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  category text not null default 'other' check (category in ('travel', 'software', 'office', 'marketing', 'utilities', 'payroll', 'other')),
  vendor text,
  description text not null,
  amount numeric(12,2) not null default 0,
  currency text not null default 'USD',
  expense_date date not null default current_date,
  receipt_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'reimbursed')),
  approved_by uuid references auth.users(id),
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger expenses_updated_at
  before update on public.expenses
  for each row execute function extensions.moddatetime(updated_at);

create index idx_expenses_tenant on public.expenses (tenant_id);
create index idx_expenses_category on public.expenses (category);
create index idx_expenses_status on public.expenses (status);
alter table public.expenses enable row level security;

-- Payments
create table public.payments (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  invoice_id uuid references public.invoices(id) on delete set null,
  amount numeric(12,2) not null default 0,
  currency text not null default 'USD',
  payment_method text not null default 'bank_transfer' check (payment_method in ('bank_transfer', 'credit_card', 'cash', 'check', 'other')),
  payment_date date not null default current_date,
  reference text,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index idx_payments_tenant on public.payments (tenant_id);
create index idx_payments_invoice on public.payments (invoice_id);
alter table public.payments enable row level security;

-- ============================================================
-- RLS Policies for Finance tables
-- ============================================================

create policy "Tenant isolation for invoices"
  on public.invoices for all
  using (tenant_id = public.get_current_tenant_id());

create policy "Tenant isolation for invoice_items"
  on public.invoice_items for all
  using (
    invoice_id in (
      select id from public.invoices
      where tenant_id = public.get_current_tenant_id()
    )
  );

create policy "Tenant isolation for expenses"
  on public.expenses for all
  using (tenant_id = public.get_current_tenant_id());

create policy "Tenant isolation for payments"
  on public.payments for all
  using (tenant_id = public.get_current_tenant_id());
