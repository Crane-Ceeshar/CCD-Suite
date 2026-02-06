-- ============================================================
-- Projects Module Schema
-- ============================================================

create table public.projects (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'on_hold', 'completed', 'cancelled')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  start_date date,
  due_date date,
  budget numeric(12,2),
  color text,
  metadata jsonb not null default '{}'::jsonb,
  owner_id uuid references auth.users(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger projects_updated_at
  before update on public.projects
  for each row execute function extensions.moddatetime(updated_at);

create index idx_projects_tenant on public.projects (tenant_id);
alter table public.projects enable row level security;

create table public.project_members (
  id uuid primary key default extensions.uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'manager', 'member', 'viewer')),
  created_at timestamptz not null default now(),
  unique(project_id, user_id)
);

create index idx_project_members_project on public.project_members (project_id);
alter table public.project_members enable row level security;

create table public.tasks (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  parent_id uuid references public.tasks(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'review', 'done', 'cancelled')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  due_date date,
  estimated_hours numeric(6,2),
  position integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  assigned_to uuid references auth.users(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function extensions.moddatetime(updated_at);

create index idx_tasks_tenant on public.tasks (tenant_id);
create index idx_tasks_project on public.tasks (project_id);
create index idx_tasks_status on public.tasks (status);
create index idx_tasks_assigned on public.tasks (assigned_to);
alter table public.tasks enable row level security;

create table public.time_entries (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  description text,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_minutes integer,
  is_running boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_time_entries_task on public.time_entries (task_id);
create index idx_time_entries_user on public.time_entries (user_id);
alter table public.time_entries enable row level security;

-- RLS Policies
create policy "Tenant isolation for projects"
  on public.projects for all using (tenant_id = public.get_current_tenant_id());

create policy "Tenant isolation for project_members"
  on public.project_members for all
  using (project_id in (select id from public.projects where tenant_id = public.get_current_tenant_id()));

create policy "Tenant isolation for tasks"
  on public.tasks for all using (tenant_id = public.get_current_tenant_id());

create policy "Tenant isolation for time_entries"
  on public.time_entries for all using (tenant_id = public.get_current_tenant_id());
