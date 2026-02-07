-- CRM Products & Services table
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  name text not null,
  description text,
  sku text,
  price numeric(12,2) not null default 0,
  currency text not null default 'USD',
  category text,
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_products_tenant on public.products(tenant_id);
create index if not exists idx_products_name on public.products(tenant_id, name);
create index if not exists idx_products_category on public.products(tenant_id, category);

-- RLS
alter table public.products enable row level security;

create policy "Tenant isolation for products"
  on public.products
  for all
  using (tenant_id = public.get_current_tenant_id())
  with check (tenant_id = public.get_current_tenant_id());

-- Auto-set tenant_id
create or replace function public.set_product_tenant()
returns trigger as $$
begin
  new.tenant_id := public.get_current_tenant_id();
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_set_product_tenant
  before insert on public.products
  for each row
  execute function public.set_product_tenant();

-- Updated_at trigger
create trigger trg_products_updated_at
  before update on public.products
  for each row
  execute function extensions.moddatetime(updated_at);
