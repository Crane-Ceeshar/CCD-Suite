import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { mediaUpdateSchema } from '@/lib/api/schemas/media';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

/**
 * PATCH /api/media/:id
 * Update a media asset's tags, alt_text, or file_name.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, supabase, user, profile } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'media:update' });
  if (limited) return limitResp!;

  const { data: body, error: bodyErr } = await validateBody(request, mediaUpdateSchema);
  if (bodyErr) return bodyErr;

  const { data, error: updateErr } = await supabase
    .from('content_assets')
    .update(body)
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .select('*')
    .single();

  if (updateErr) return dbError(updateErr, 'Media asset');

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'update_media_asset',
    resource_type: 'content_asset',
    resource_id: id,
    details: { fields: Object.keys(body!) },
  });

  return success(data);
}

/**
 * DELETE /api/media/:id
 * Delete a media asset.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, supabase, user, profile } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'media:delete' });
  if (limited) return limitResp!;

  const { error: deleteErr } = await supabase
    .from('content_assets')
    .delete()
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id);

  if (deleteErr) return dbError(deleteErr, 'Failed to delete media asset');

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'delete_media_asset',
    resource_type: 'content_asset',
    resource_id: id,
  });

  return success({ deleted: true });
}
