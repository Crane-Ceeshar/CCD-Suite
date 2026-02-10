import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { logAudit } from '@/lib/api/audit';
import { dashboardShareSchema } from '@/lib/api/schemas/analytics-advanced';
import { randomUUID } from 'crypto';

/**
 * POST /api/analytics/dashboards/:id/share
 * Toggle public sharing for a dashboard.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { data: body, error: bodyError } = await validateBody(request, dashboardShareSchema);
  if (bodyError) return bodyError;

  // Fetch the current dashboard to check existing share_token
  const { data: dashboard, error: fetchError } = await supabase
    .from('dashboards')
    .select('id, share_token, is_public')
    .eq('id', id)
    .single();

  if (fetchError) {
    return dbError(fetchError, 'Dashboard');
  }

  let shareToken: string | null = dashboard.share_token;

  if (body.is_public) {
    // Generate a new token if one doesn't exist
    if (!shareToken) {
      shareToken = randomUUID();
    }
  } else {
    // Revoke sharing
    shareToken = null;
  }

  const { data: updated, error: updateError } = await supabase
    .from('dashboards')
    .update({
      is_public: body.is_public,
      share_token: shareToken,
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return dbError(updateError, 'Failed to update dashboard sharing');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: body.is_public ? 'dashboard.shared' : 'dashboard.unshared',
    resource_type: 'dashboard',
    resource_id: id,
    details: { is_public: body.is_public },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.ccdsuite.com';

  return success({
    share_token: shareToken,
    is_public: body.is_public,
    share_url: shareToken ? `${baseUrl}/api/analytics/dashboards/public/${shareToken}` : null,
  });
}
