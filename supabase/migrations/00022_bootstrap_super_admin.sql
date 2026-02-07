-- ============================================================
-- Bootstrap super admin: RPC function to promote a user to admin
-- Safety guard: only works when no admin exists yet
-- ============================================================

create or replace function public.promote_to_admin(target_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Only allow if no admin exists yet (bootstrap only)
  if exists (select 1 from public.profiles where user_type = 'admin') then
    raise exception 'An admin already exists. Use the admin portal to manage users.';
  end if;

  -- Promote the user
  update public.profiles
  set user_type = 'admin'
  where email = target_email;

  if not found then
    raise exception 'No user found with email: %', target_email;
  end if;
end;
$$;

-- Only service_role should call this (not exposed to anon/authenticated)
revoke execute on function public.promote_to_admin(text) from anon;
revoke execute on function public.promote_to_admin(text) from authenticated;
