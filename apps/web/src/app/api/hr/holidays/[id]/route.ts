import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError, notFound } from '@/lib/api/responses';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

/**
 * DELETE /api/hr/holidays/[id]
 * Delete a public holiday.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'hr:holidays:delete' });
  if (limited) return limitResp!;

  const { data: holiday, error: fetchError } = await supabase
    .from('public_holidays')
    .select('id, name')
    .eq('id', id)
    .single();

  if (fetchError) {
    return dbError(fetchError, 'Holiday not found');
  }

  const { error: deleteError } = await supabase
    .from('public_holidays')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return dbError(deleteError, 'Failed to delete holiday');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'holiday.deleted',
    resource_type: 'public_holiday',
    resource_id: id,
    details: { name: holiday.name },
  });

  return success({ deleted: true });
}
