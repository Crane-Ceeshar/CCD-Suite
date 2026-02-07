-- System Announcements table
-- Allows admins to push notifications/banners to all users across tenants
create table public.system_announcements (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid references public.tenants(id) on delete cascade,  -- NULL = global (all tenants)
  title text not null,
  message text not null,
  type text not null default 'info' check (type in ('info', 'warning', 'critical')),
  is_active boolean not null default true,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_by uuid not null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-update updated_at
create trigger system_announcements_updated_at
  before update on public.system_announcements
  for each row execute function extensions.moddatetime(updated_at);

-- Indexes
create index idx_announcements_active on public.system_announcements (is_active, starts_at, ends_at);
create index idx_announcements_tenant on public.system_announcements (tenant_id);

-- RLS
alter table public.system_announcements enable row level security;

create policy "Admins can manage announcements"
  on public.system_announcements for all
  using (public.is_admin());

create policy "Users can view active announcements"
  on public.system_announcements for select
  using (
    is_active = true
    and starts_at <= now()
    and (ends_at is null or ends_at >= now())
    and (tenant_id is null or tenant_id = public.get_current_tenant_id())
  );
