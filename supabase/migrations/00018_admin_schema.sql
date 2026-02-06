-- ============================================================
-- Admin Module Schema
-- ============================================================

-- Activity Logs (audit trail)
create table public.activity_logs (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  details jsonb not null default '{}'::jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);

create index idx_activity_logs_tenant on public.activity_logs (tenant_id);
create index idx_activity_logs_user on public.activity_logs (user_id);
create index idx_activity_logs_action on public.activity_logs (action);
create index idx_activity_logs_created on public.activity_logs (tenant_id, created_at desc);
alter table public.activity_logs enable row level security;

-- System Settings (per-tenant key-value config)
create table public.system_settings (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint system_settings_tenant_key_unique unique (tenant_id, key)
);

create trigger system_settings_updated_at
  before update on public.system_settings
  for each row execute function extensions.moddatetime(updated_at);

create index idx_system_settings_tenant on public.system_settings (tenant_id);
alter table public.system_settings enable row level security;

-- API Keys
create table public.api_keys (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null,
  scopes text[] not null default '{}',
  is_active boolean not null default true,
  last_used_at timestamptz,
  expires_at timestamptz,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger api_keys_updated_at
  before update on public.api_keys
  for each row execute function extensions.moddatetime(updated_at);

create index idx_api_keys_tenant on public.api_keys (tenant_id);
create index idx_api_keys_hash on public.api_keys (key_hash);
create index idx_api_keys_active on public.api_keys (tenant_id, is_active);
alter table public.api_keys enable row level security;

-- ============================================================
-- RLS Policies for Admin tables
-- ============================================================

-- Activity logs: admins can read, system can insert
create policy "Admins can view activity logs"
  on public.activity_logs for select
  using (
    tenant_id = public.get_current_tenant_id()
    and public.is_admin()
  );

create policy "System can insert activity logs"
  on public.activity_logs for insert
  with check (tenant_id = public.get_current_tenant_id());

-- System settings: admins only
create policy "Admins can manage system settings"
  on public.system_settings for all
  using (
    tenant_id = public.get_current_tenant_id()
    and public.is_admin()
  );

-- API keys: admins only
create policy "Admins can manage api keys"
  on public.api_keys for all
  using (
    tenant_id = public.get_current_tenant_id()
    and public.is_admin()
  );
