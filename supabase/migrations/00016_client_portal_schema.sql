-- ============================================================
-- Client Portal Module Schema
-- ============================================================

-- Portal Projects
create table public.portal_projects (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  client_id uuid references auth.users(id) on delete set null,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'completed', 'on_hold')),
  start_date date,
  end_date date,
  budget numeric(12,2),
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger portal_projects_updated_at
  before update on public.portal_projects
  for each row execute function extensions.moddatetime(updated_at);

create index idx_portal_projects_tenant on public.portal_projects (tenant_id);
create index idx_portal_projects_client on public.portal_projects (client_id);
alter table public.portal_projects enable row level security;

-- Portal Milestones
create table public.portal_milestones (
  id uuid primary key default extensions.uuid_generate_v4(),
  portal_project_id uuid not null references public.portal_projects(id) on delete cascade,
  title text not null,
  description text,
  due_date date,
  status text not null default 'upcoming' check (status in ('upcoming', 'in_progress', 'completed', 'overdue')),
  position integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_portal_milestones_project on public.portal_milestones (portal_project_id);
alter table public.portal_milestones enable row level security;

-- Portal Deliverables
create table public.portal_deliverables (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  portal_project_id uuid not null references public.portal_projects(id) on delete cascade,
  title text not null,
  description text,
  file_url text,
  file_name text,
  file_size bigint,
  status text not null default 'pending_review' check (status in ('pending_review', 'approved', 'revision_requested', 'delivered')),
  feedback text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger portal_deliverables_updated_at
  before update on public.portal_deliverables
  for each row execute function extensions.moddatetime(updated_at);

create index idx_portal_deliverables_tenant on public.portal_deliverables (tenant_id);
create index idx_portal_deliverables_project on public.portal_deliverables (portal_project_id);
alter table public.portal_deliverables enable row level security;

-- Portal Messages
create table public.portal_messages (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  portal_project_id uuid not null references public.portal_projects(id) on delete cascade,
  sender_id uuid not null references auth.users(id),
  content text not null,
  attachments jsonb not null default '[]'::jsonb,
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_portal_messages_tenant on public.portal_messages (tenant_id);
create index idx_portal_messages_project on public.portal_messages (portal_project_id);
alter table public.portal_messages enable row level security;

-- Portal Access Tokens (magic link)
create table public.portal_access_tokens (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  client_email text not null,
  token_hash text not null,
  portal_project_id uuid references public.portal_projects(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index idx_portal_access_tokens_tenant on public.portal_access_tokens (tenant_id);
create index idx_portal_access_tokens_hash on public.portal_access_tokens (token_hash);
alter table public.portal_access_tokens enable row level security;

-- ============================================================
-- RLS Policies for Client Portal tables
-- ============================================================

-- Portal projects: admins see all tenant projects, clients see only their own
create policy "Tenant isolation for portal_projects"
  on public.portal_projects for all
  using (
    tenant_id = public.get_current_tenant_id()
    or client_id = auth.uid()
  );

-- Milestones: accessible if user has access to parent project
create policy "Tenant isolation for portal_milestones"
  on public.portal_milestones for all
  using (
    portal_project_id in (
      select id from public.portal_projects
      where tenant_id = public.get_current_tenant_id()
         or client_id = auth.uid()
    )
  );

-- Deliverables: accessible if user has access to parent project
create policy "Tenant isolation for portal_deliverables"
  on public.portal_deliverables for all
  using (
    tenant_id = public.get_current_tenant_id()
    or portal_project_id in (
      select id from public.portal_projects
      where client_id = auth.uid()
    )
  );

-- Messages: tenant members see all, clients don't see internal
create policy "Tenant members see all messages"
  on public.portal_messages for all
  using (tenant_id = public.get_current_tenant_id());

create policy "Clients see non-internal messages"
  on public.portal_messages for select
  using (
    is_internal = false
    and portal_project_id in (
      select id from public.portal_projects
      where client_id = auth.uid()
    )
  );

-- Access tokens: tenant isolation
create policy "Tenant isolation for portal_access_tokens"
  on public.portal_access_tokens for all
  using (tenant_id = public.get_current_tenant_id());
