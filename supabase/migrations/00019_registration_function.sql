-- ============================================================
-- Registration function: creates tenant + signs up user atomically
-- Runs as SECURITY DEFINER to bypass RLS during registration
-- ============================================================

create or replace function public.register_tenant(
  p_tenant_name text,
  p_tenant_slug text,
  p_settings jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tenant_id uuid;
begin
  -- Validate inputs
  if p_tenant_name is null or length(trim(p_tenant_name)) < 2 then
    raise exception 'Tenant name must be at least 2 characters';
  end if;

  if p_tenant_slug is null or length(trim(p_tenant_slug)) < 2 then
    raise exception 'Tenant slug must be at least 2 characters';
  end if;

  -- Check for duplicate slug
  if exists (select 1 from public.tenants where slug = p_tenant_slug) then
    raise exception 'Organization slug already exists. Please choose a different name.';
  end if;

  -- Create the tenant
  insert into public.tenants (name, slug, settings)
  values (
    trim(p_tenant_name),
    trim(p_tenant_slug),
    jsonb_build_object(
      'modules_enabled', coalesce(p_settings -> 'selected_modules', '["crm","analytics","content","seo","social","client_portal","projects","finance","hr"]'::jsonb),
      'team_size', coalesce(p_settings ->> 'team_size', '1-5'),
      'features', '{}'::jsonb
    )
  )
  returning id into v_tenant_id;

  return v_tenant_id;
end;
$$;

-- Grant execute to anon and authenticated roles so it can be called during registration
grant execute on function public.register_tenant(text, text, jsonb) to anon;
grant execute on function public.register_tenant(text, text, jsonb) to authenticated;
