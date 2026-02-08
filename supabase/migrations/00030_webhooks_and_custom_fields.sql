-- ============================================================
-- Migration: Webhooks, Custom Field Definitions, Activity Log RLS fix
-- ============================================================

-- Webhooks table for external integrations
create table public.webhooks (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  url text not null,
  events text[] not null default '{}',
  secret text not null,
  is_active boolean not null default true,
  last_triggered_at timestamptz,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger webhooks_updated_at
  before update on public.webhooks
  for each row execute function extensions.moddatetime(updated_at);

create index idx_webhooks_tenant on public.webhooks (tenant_id);
create index idx_webhooks_active on public.webhooks (tenant_id, is_active);
alter table public.webhooks enable row level security;

-- RLS: Tenant users can view webhooks
create policy "Tenant users can view webhooks"
  on public.webhooks for select
  using (tenant_id = public.get_current_tenant_id());

-- RLS: Tenant admins can manage webhooks
create policy "Tenant admins can manage webhooks"
  on public.webhooks for all
  using (tenant_id = public.get_current_tenant_id() and public.is_tenant_admin());

-- ============================================================

-- Custom field definitions table
create table public.custom_field_definitions (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  module text not null,
  entity_type text not null,
  field_name text not null,
  field_label text not null,
  field_type text not null check (field_type in ('text', 'number', 'date', 'select', 'boolean', 'url', 'email')),
  options jsonb not null default '[]'::jsonb,
  is_required boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint custom_fields_unique unique (tenant_id, module, entity_type, field_name)
);

create trigger custom_field_definitions_updated_at
  before update on public.custom_field_definitions
  for each row execute function extensions.moddatetime(updated_at);

create index idx_custom_fields_tenant_module on public.custom_field_definitions (tenant_id, module, entity_type);
alter table public.custom_field_definitions enable row level security;

-- RLS: Tenant users can view custom field definitions
create policy "Tenant users can view custom field definitions"
  on public.custom_field_definitions for select
  using (tenant_id = public.get_current_tenant_id());

-- RLS: Tenant admins can manage custom field definitions
create policy "Tenant admins can manage custom field definitions"
  on public.custom_field_definitions for all
  using (tenant_id = public.get_current_tenant_id() and public.is_tenant_admin());

-- ============================================================
-- Fix activity_logs RLS: allow tenant admins to view their own logs
-- (Currently only platform admins via is_admin() can view)
-- ============================================================

create policy "Tenant admins can view activity logs"
  on public.activity_logs for select
  using (
    tenant_id = public.get_current_tenant_id()
    and public.is_tenant_admin()
  );
