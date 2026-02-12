import { NextRequest } from 'next/server';
import { requireAdmin, createAdminServiceClient } from '@/lib/supabase/admin';
import { success, notFound, dbError } from '@/lib/api/responses';
import { rateLimit, RATE_LIMIT_PRESETS } from '@/lib/api/rate-limit';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authErr, user, profile } = await requireAdmin();
  if (authErr) return authErr;

  const { limited, response } = rateLimit(user.id, RATE_LIMIT_PRESETS.admin);
  if (limited) return response!;

  const { id } = await params;
  const serviceClient = createAdminServiceClient();

  const { data, error: queryErr } = await serviceClient
    .from('security_scan_results')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .single();

  if (queryErr) return dbError(queryErr, 'Security scan');
  if (!data) return notFound('Security scan');

  return success(data);
}
