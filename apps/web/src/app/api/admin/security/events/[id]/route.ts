import { NextRequest } from 'next/server';
import { requireAdmin, createAdminServiceClient } from '@/lib/supabase/admin';
import { success, error, notFound, dbError } from '@/lib/api/responses';
import { rateLimit, RATE_LIMIT_PRESETS } from '@/lib/api/rate-limit';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authErr, user, profile } = await requireAdmin();
  if (authErr) return authErr;

  const { limited, response } = rateLimit(user.id, RATE_LIMIT_PRESETS.admin);
  if (limited) return response!;

  const { id } = await params;

  let body: { resolved?: boolean; notes?: string };
  try {
    body = await request.json();
  } catch {
    return error('Invalid JSON body', 400);
  }

  if (body.resolved !== true) {
    return error('Only resolved=true is supported', 400);
  }

  const serviceClient = createAdminServiceClient();

  // Fetch the existing event to merge notes (scoped to tenant)
  const { data: existing, error: fetchErr } = await serviceClient
    .from('security_events')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .single();

  if (fetchErr) return dbError(fetchErr, 'Security event');
  if (!existing) return notFound('Security event');

  const updatedDetails = {
    ...(typeof existing.details === 'object' && existing.details !== null ? existing.details : {}),
    ...(body.notes ? { resolution_notes: body.notes } : {}),
  };

  const { data: updated, error: updateErr } = await serviceClient
    .from('security_events')
    .update({
      resolved: true,
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
      details: updatedDetails,
    })
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .select('*')
    .single();

  if (updateErr) return dbError(updateErr, 'Failed to resolve security event');

  return success(updated);
}
