import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { logAudit } from '@/lib/api/audit';

/**
 * GET /api/portal/access/tokens
 * List active access tokens.
 */
export async function GET(request: NextRequest) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const portalProjectId = request.nextUrl.searchParams.get('portal_project_id');

  let q = supabase
    .from('portal_access_tokens')
    .select('id, client_email, portal_project_id, expires_at, used_at, created_at')
    .order('created_at', { ascending: false });

  if (portalProjectId) {
    q = q.eq('portal_project_id', portalProjectId);
  }

  const { data, error: queryError } = await q;

  if (queryError) {
    return dbError(queryError, 'Failed to fetch tokens');
  }

  return success(data);
}

/**
 * DELETE /api/portal/access/tokens
 * Revoke an access token by ID.
 */
export async function DELETE(request: NextRequest) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const tokenId = request.nextUrl.searchParams.get('id');
  if (!tokenId) {
    return success({ error: 'Token ID is required' });
  }

  const { error: deleteError } = await supabase
    .from('portal_access_tokens')
    .delete()
    .eq('id', tokenId);

  if (deleteError) {
    return dbError(deleteError, 'Failed to revoke token');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'portal_access.revoked',
    resource_type: 'portal_access_token',
    resource_id: tokenId,
    details: {},
  });

  return success({ revoked: true });
}
