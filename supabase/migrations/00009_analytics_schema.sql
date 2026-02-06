-- ============================================================
-- Analytics Module Schema
-- ============================================================

create table public.dashboards (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  description text,
  is_default boolean not null default false,
  layout jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger dashboards_updated_at
  before update on public.dashboards
  for each row execute function extensions.moddatetime(updated_at);

create index idx_dashboards_tenant on public.dashboards (tenant_id);
alter table public.dashboards enable row level security;

create table public.widgets (
  id uuid primary key default extensions.uuid_generate_v4(),
  dashboard_id uuid not null references public.dashboards(id) on delete cascade,
  title text not null,
  widget_type text not null check (widget_type in ('line_chart', 'bar_chart', 'pie_chart', 'area_chart', 'stat_card', 'table', 'metric')),
  data_source text not null,
  config jsonb not null default '{}'::jsonb,
  position jsonb not null default '{"x": 0, "y": 0, "w": 4, "h": 3}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_widgets_dashboard on public.widgets (dashboard_id);
alter table public.widgets enable row level security;

create table public.metrics (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  module text not null,
  metric_name text not null,
  metric_value numeric not null,
  dimensions jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null default now()
);

create index idx_metrics_tenant on public.metrics (tenant_id);
create index idx_metrics_module on public.metrics (module);
create index idx_metrics_recorded on public.metrics (recorded_at);
alter table public.metrics enable row level security;

-- RLS
create policy "Tenant isolation for dashboards"
  on public.dashboards for all using (tenant_id = public.get_current_tenant_id());

create policy "Tenant isolation for widgets"
  on public.widgets for all
  using (dashboard_id in (select id from public.dashboards where tenant_id = public.get_current_tenant_id()));

create policy "Tenant isolation for metrics"
  on public.metrics for all using (tenant_id = public.get_current_tenant_id());
