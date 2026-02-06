-- Custom user type definitions per tenant
create table public.user_type_definitions (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  modules text[] not null default '{}',
  is_system boolean not null default false,
  created_at timestamptz not null default now(),

  -- Each tenant can have unique slugs
  unique (tenant_id, slug)
);

-- Index for tenant lookups
create index idx_user_type_defs_tenant on public.user_type_definitions (tenant_id);

-- Enable RLS
alter table public.user_type_definitions enable row level security;

comment on table public.user_type_definitions is 'Per-tenant user type definitions with module access mappings';
