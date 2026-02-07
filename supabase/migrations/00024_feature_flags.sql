-- Feature Flags table
-- Global feature flags that can be toggled per-tenant or globally
create table public.feature_flags (
  id uuid primary key default extensions.uuid_generate_v4(),
  key text not null unique,
  name text not null,
  description text not null default '',
  is_enabled boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger feature_flags_updated_at
  before update on public.feature_flags
  for each row execute function extensions.moddatetime(updated_at);

-- Per-tenant overrides for feature flags
create table public.feature_flag_overrides (
  id uuid primary key default extensions.uuid_generate_v4(),
  flag_id uuid not null references public.feature_flags(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  is_enabled boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feature_flag_overrides_unique unique (flag_id, tenant_id)
);

create trigger feature_flag_overrides_updated_at
  before update on public.feature_flag_overrides
  for each row execute function extensions.moddatetime(updated_at);

create index idx_ff_overrides_tenant on public.feature_flag_overrides (tenant_id);
create index idx_ff_overrides_flag on public.feature_flag_overrides (flag_id);

-- RLS
alter table public.feature_flags enable row level security;
alter table public.feature_flag_overrides enable row level security;

create policy "Admins can manage feature flags"
  on public.feature_flags for all
  using (public.is_admin());

create policy "Users can read feature flags"
  on public.feature_flags for select
  using (true);

create policy "Admins can manage flag overrides"
  on public.feature_flag_overrides for all
  using (public.is_admin());

create policy "Users can read their tenant flag overrides"
  on public.feature_flag_overrides for select
  using (tenant_id = public.get_current_tenant_id());
