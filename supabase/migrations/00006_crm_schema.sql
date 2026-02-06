-- ============================================================
-- CRM Module Schema
-- ============================================================

-- Companies
create table public.companies (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  industry text,
  website text,
  phone text,
  email text,
  address text,
  city text,
  state text,
  country text,
  notes text,
  status text not null default 'active' check (status in ('active', 'inactive', 'prospect')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger companies_updated_at
  before update on public.companies
  for each row execute function extensions.moddatetime(updated_at);

create index idx_companies_tenant on public.companies (tenant_id);
alter table public.companies enable row level security;

-- Contacts
create table public.contacts (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  job_title text,
  avatar_url text,
  status text not null default 'active' check (status in ('active', 'inactive', 'lead')),
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger contacts_updated_at
  before update on public.contacts
  for each row execute function extensions.moddatetime(updated_at);

create index idx_contacts_tenant on public.contacts (tenant_id);
create index idx_contacts_company on public.contacts (company_id);
alter table public.contacts enable row level security;

-- Pipelines
create table public.pipelines (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_pipelines_tenant on public.pipelines (tenant_id);
alter table public.pipelines enable row level security;

-- Pipeline Stages
create table public.pipeline_stages (
  id uuid primary key default extensions.uuid_generate_v4(),
  pipeline_id uuid not null references public.pipelines(id) on delete cascade,
  name text not null,
  position integer not null default 0,
  color text,
  probability integer default 0 check (probability >= 0 and probability <= 100),
  created_at timestamptz not null default now()
);

create index idx_pipeline_stages_pipeline on public.pipeline_stages (pipeline_id);
alter table public.pipeline_stages enable row level security;

-- Deals
create table public.deals (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  pipeline_id uuid not null references public.pipelines(id) on delete cascade,
  stage_id uuid not null references public.pipeline_stages(id),
  company_id uuid references public.companies(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  title text not null,
  value numeric(12,2) default 0,
  currency text not null default 'USD',
  status text not null default 'open' check (status in ('open', 'won', 'lost')),
  expected_close_date date,
  actual_close_date date,
  notes text,
  position integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  assigned_to uuid references auth.users(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger deals_updated_at
  before update on public.deals
  for each row execute function extensions.moddatetime(updated_at);

create index idx_deals_tenant on public.deals (tenant_id);
create index idx_deals_pipeline on public.deals (pipeline_id);
create index idx_deals_stage on public.deals (stage_id);
create index idx_deals_status on public.deals (status);
alter table public.deals enable row level security;

-- Activities (calls, emails, meetings, notes)
create table public.activities (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  type text not null check (type in ('call', 'email', 'meeting', 'note', 'task')),
  title text not null,
  description text,
  scheduled_at timestamptz,
  completed_at timestamptz,
  is_completed boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index idx_activities_tenant on public.activities (tenant_id);
create index idx_activities_deal on public.activities (deal_id);
create index idx_activities_contact on public.activities (contact_id);
alter table public.activities enable row level security;

-- ============================================================
-- RLS Policies for CRM tables
-- ============================================================

-- Companies policies
create policy "Tenant isolation for companies"
  on public.companies for all
  using (tenant_id = public.get_current_tenant_id());

-- Contacts policies
create policy "Tenant isolation for contacts"
  on public.contacts for all
  using (tenant_id = public.get_current_tenant_id());

-- Pipelines policies
create policy "Tenant isolation for pipelines"
  on public.pipelines for all
  using (tenant_id = public.get_current_tenant_id());

-- Pipeline stages policies
create policy "Tenant isolation for pipeline_stages"
  on public.pipeline_stages for all
  using (
    pipeline_id in (
      select id from public.pipelines
      where tenant_id = public.get_current_tenant_id()
    )
  );

-- Deals policies
create policy "Tenant isolation for deals"
  on public.deals for all
  using (tenant_id = public.get_current_tenant_id());

-- Activities policies
create policy "Tenant isolation for activities"
  on public.activities for all
  using (tenant_id = public.get_current_tenant_id());

-- ============================================================
-- Seed default pipeline for demo tenant
-- ============================================================
insert into public.pipelines (id, tenant_id, name, is_default)
values ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Sales Pipeline', true);

insert into public.pipeline_stages (pipeline_id, name, position, color, probability) values
  ('00000000-0000-0000-0000-000000000010', 'Lead', 0, '#94a3b8', 10),
  ('00000000-0000-0000-0000-000000000010', 'Qualified', 1, '#3b82f6', 25),
  ('00000000-0000-0000-0000-000000000010', 'Proposal', 2, '#8b5cf6', 50),
  ('00000000-0000-0000-0000-000000000010', 'Negotiation', 3, '#f59e0b', 75),
  ('00000000-0000-0000-0000-000000000010', 'Closed Won', 4, '#22c55e', 100);
