-- ============================================================
-- Notifications Schema
-- ============================================================

create table public.notifications (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('info', 'success', 'warning', 'error', 'mention', 'assignment', 'update', 'reminder')),
  title text not null,
  message text,
  link text,
  module text,
  is_read boolean not null default false,
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on public.notifications (user_id);
create index idx_notifications_tenant on public.notifications (tenant_id);
create index idx_notifications_read on public.notifications (user_id, is_read);
alter table public.notifications enable row level security;

-- Users can only see their own notifications
create policy "Users can view own notifications"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "Users can update own notifications"
  on public.notifications for update
  using (user_id = auth.uid());

-- System/admin can insert notifications for any user in tenant
create policy "System can insert notifications"
  on public.notifications for insert
  with check (tenant_id = public.get_current_tenant_id());
