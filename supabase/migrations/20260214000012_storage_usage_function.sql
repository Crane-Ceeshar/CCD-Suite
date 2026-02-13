-- Function to calculate total storage bytes for a tenant.
-- All storage paths are prefixed with the tenant UUID, so we sum file
-- sizes across all buckets where `name` starts with the tenant ID.
CREATE FUNCTION public.get_tenant_storage_bytes(p_tenant_id uuid)
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

-- Allow authenticated users and service_role to call this function
GRANT EXECUTE ON FUNCTION public.get_tenant_storage_bytes(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_storage_bytes(uuid) TO service_role;
