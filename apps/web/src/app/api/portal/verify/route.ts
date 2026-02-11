import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase/service-client';

/**
 * POST /api/portal/verify
 * Public endpoint — verifies a magic link token.
 * No authentication required.
 */
export async function POST(request: NextRequest) {
  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid request body' } },
      { status: 400 }
    );
  }

  const { token } = body;
  if (!token || typeof token !== 'string') {
    return NextResponse.json(
      { success: false, error: { message: 'Token is required' } },
      { status: 400 }
    );
  }

  // Hash the raw token to compare with stored hash
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const supabase = createServiceClient();

  // Look up the token: must exist, not used, not expired
  const { data, error } = await supabase
    .from('portal_access_tokens')
    .select('id, client_email, portal_project_id, tenant_id, expires_at, used_at')
    .eq('token_hash', tokenHash)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired access link' } },
      { status: 401 }
    );
  }

  // Mark token as used
  await supabase
    .from('portal_access_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', data.id);

  return NextResponse.json({
    success: true,
    data: {
      token_id: data.id,
      client_email: data.client_email,
      portal_project_id: data.portal_project_id,
      tenant_id: data.tenant_id,
    },
  });
}
