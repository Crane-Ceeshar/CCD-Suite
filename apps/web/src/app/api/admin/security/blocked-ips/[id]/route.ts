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

  let body: { is_active?: boolean; expires_at?: string };
  try {
    body = await request.json();
  } catch {
    return error('Invalid JSON body', 400);
  }

  const updateData: Record<string, unknown> = {};
  if (typeof body.is_active === 'boolean') updateData.is_active = body.is_active;
  if (body.expires_at !== undefined) updateData.expires_at = body.expires_at;

  if (Object.keys(updateData).length === 0) {
    return error('No fields to update', 400);
  }

  const serviceClient = createAdminServiceClient();

  const { data, error: updateErr } = await serviceClient
    .from('blocked_ips')
    .update(updateData)
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .select('*')
    .single();

  if (updateErr) return dbError(updateErr, 'Blocked IP');

  if (!data) return notFound('Blocked IP');

  return success(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authErr, user, profile } = await requireAdmin();
  if (authErr) return authErr;

  const { limited, response } = rateLimit(user.id, RATE_LIMIT_PRESETS.admin);
  if (limited) return response!;

  const { id } = await params;

  const serviceClient = createAdminServiceClient();

  const { error: deleteErr } = await serviceClient
    .from('blocked_ips')
    .delete()
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id);

  if (deleteErr) return dbError(deleteErr, 'Failed to delete blocked IP');

  return success({ deleted: true });
}
