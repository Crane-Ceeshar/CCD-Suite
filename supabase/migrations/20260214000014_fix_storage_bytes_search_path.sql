-- Fix search_path for get_tenant_storage_bytes (applied without it in 000012)
CREATE OR REPLACE FUNCTION public.get_tenant_storage_bytes(p_tenant_id uuid)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT COALESCE(SUM((metadata->>'size')::bigint), 0)
  FROM storage.objects
  WHERE name LIKE p_tenant_id::text || '/%';
$$;
