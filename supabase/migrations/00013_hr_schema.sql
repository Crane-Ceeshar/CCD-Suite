-- ============================================================
-- HR Module Schema
-- ============================================================

-- Departments
create table public.departments (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  description text,
  head_id uuid, -- set after employees table created
  created_at timestamptz not null default now()
);

create index idx_departments_tenant on public.departments (tenant_id);
alter table public.departments enable row level security;

-- Employees
create table public.employees (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  department_id uuid references public.departments(id) on delete set null,
  job_title text,
  employment_type text not null default 'full_time' check (employment_type in ('full_time', 'part_time', 'contract', 'intern')),
  status text not null default 'active' check (status in ('active', 'on_leave', 'terminated')),
  hire_date date not null default current_date,
  termination_date date,
  salary numeric(12,2),
  salary_currency text not null default 'USD',
  manager_id uuid references public.employees(id) on delete set null,
  avatar_url text,
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger employees_updated_at
  before update on public.employees
  for each row execute function extensions.moddatetime(updated_at);

create index idx_employees_tenant on public.employees (tenant_id);
create index idx_employees_status on public.employees (status);
create index idx_employees_department on public.employees (department_id);
alter table public.employees enable row level security;

-- Add FK from departments.head_id to employees
alter table public.departments
  add constraint fk_departments_head
  foreign key (head_id) references public.employees(id) on delete set null;

-- Leave Requests
create table public.leave_requests (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  type text not null check (type in ('annual', 'sick', 'personal', 'maternity', 'paternity', 'unpaid')),
  start_date date not null,
  end_date date not null,
  days_count numeric(4,1) not null default 1,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_leave_requests_tenant on public.leave_requests (tenant_id);
create index idx_leave_requests_employee on public.leave_requests (employee_id);
create index idx_leave_requests_status on public.leave_requests (status);
alter table public.leave_requests enable row level security;

-- Attendance Records
create table public.attendance_records (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  date date not null,
  clock_in timestamptz,
  clock_out timestamptz,
  hours_worked numeric(4,2),
  status text not null default 'present' check (status in ('present', 'absent', 'late', 'half_day')),
  notes text,
  created_at timestamptz not null default now()
);

create index idx_attendance_tenant on public.attendance_records (tenant_id);
create index idx_attendance_employee_date on public.attendance_records (employee_id, date);
alter table public.attendance_records enable row level security;

-- Payroll Runs
create table public.payroll_runs (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  status text not null default 'draft' check (status in ('draft', 'processing', 'completed', 'cancelled')),
  total_gross numeric(14,2) not null default 0,
  total_deductions numeric(14,2) not null default 0,
  total_net numeric(14,2) not null default 0,
  currency text not null default 'USD',
  processed_by uuid references auth.users(id),
  processed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_payroll_runs_tenant on public.payroll_runs (tenant_id);
alter table public.payroll_runs enable row level security;

-- Payroll Items
create table public.payroll_items (
  id uuid primary key default extensions.uuid_generate_v4(),
  payroll_run_id uuid not null references public.payroll_runs(id) on delete cascade,
  employee_id uuid not null references public.employees(id),
  gross_amount numeric(12,2) not null default 0,
  deductions numeric(12,2) not null default 0,
  net_amount numeric(12,2) not null default 0,
  breakdown jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_payroll_items_run on public.payroll_items (payroll_run_id);
alter table public.payroll_items enable row level security;

-- ============================================================
-- RLS Policies for HR tables
-- ============================================================

create policy "Tenant isolation for departments"
  on public.departments for all
  using (tenant_id = public.get_current_tenant_id());

create policy "Tenant isolation for employees"
  on public.employees for all
  using (tenant_id = public.get_current_tenant_id());

create policy "Tenant isolation for leave_requests"
  on public.leave_requests for all
  using (tenant_id = public.get_current_tenant_id());

create policy "Tenant isolation for attendance_records"
  on public.attendance_records for all
  using (tenant_id = public.get_current_tenant_id());

create policy "Tenant isolation for payroll_runs"
  on public.payroll_runs for all
  using (tenant_id = public.get_current_tenant_id());

create policy "Tenant isolation for payroll_items"
  on public.payroll_items for all
  using (
    payroll_run_id in (
      select id from public.payroll_runs
      where tenant_id = public.get_current_tenant_id()
    )
  );
