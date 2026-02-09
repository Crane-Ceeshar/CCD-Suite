-- AI Module Context: Captures user activity patterns within modules
-- so AI can learn from behavior and provide improving, personalised suggestions.

create table if not exists public.ai_module_context (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  module text not null check (module in ('social', 'seo')),
  context_type text not null,
  context_data jsonb not null default '{}',
  created_at timestamptz not null default now()
);

comment on table public.ai_module_context is 'Captures module-level user activities to feed AI with usage patterns for improved suggestions';

-- Indexes for common query patterns
create index idx_ai_module_context_tenant_module on public.ai_module_context (tenant_id, module);
create index idx_ai_module_context_tenant_module_type on public.ai_module_context (tenant_id, module, context_type);
create index idx_ai_module_context_created on public.ai_module_context (created_at desc);

-- RLS
alter table public.ai_module_context enable row level security;

create policy "ai_module_context_tenant_read"
  on public.ai_module_context for select
  using (tenant_id = public.get_current_tenant_id());

create policy "ai_module_context_tenant_insert"
  on public.ai_module_context for insert
  with check (tenant_id = public.get_current_tenant_id());

-- Grant access
grant select, insert on public.ai_module_context to authenticated;
