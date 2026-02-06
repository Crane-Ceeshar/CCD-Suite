-- Tenants table
create table public.tenants (
  id uuid primary key default extensions.uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  plan text not null default 'starter'
    check (plan in ('starter', 'professional', 'enterprise', 'custom')),
  logo_url text,
  settings jsonb not null default '{
    "modules_enabled": ["crm", "analytics", "content", "seo", "social", "client_portal", "projects", "finance", "hr"],
    "features": {}
  }'::jsonb,
  max_users integer not null default 5,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-update updated_at
create trigger tenants_updated_at
  before update on public.tenants
  for each row
  execute function extensions.moddatetime(updated_at);

-- Index for slug lookups
create index idx_tenants_slug on public.tenants (slug);

-- Enable RLS
alter table public.tenants enable row level security;

comment on table public.tenants is 'Multi-tenant organizations';
