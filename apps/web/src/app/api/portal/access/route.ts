import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { createAccessTokenSchema } from '@/lib/api/schemas/portal';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';
import crypto from 'crypto';

/**
 * POST /api/portal/access
 * Generate a magic link access token for a client.
 */
export async function POST(request: NextRequest) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 20, keyPrefix: 'portal:access:create' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, createAccessTokenSchema);
  if (bodyError) return bodyError;

  // Generate a secure token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + body.expires_in_days);

  const { data, error: insertError } = await supabase
    .from('portal_access_tokens')
    .insert({
      tenant_id: profile.tenant_id,
      portal_project_id: body.portal_project_id ?? null,
      client_email: body.client_email,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
      created_by: user.id,
    })
    .select()
    .single();

  if (insertError) {
    return dbError(insertError, 'Failed to create access token');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'portal_access.created',
    resource_type: 'portal_access_token',
    resource_id: data.id,
    details: { client_email: body.client_email, expires_in_days: body.expires_in_days },
  });

  // Return the raw token so the link can be composed
  return success({
    ...data,
    raw_token: rawToken,
  }, 201);
}
