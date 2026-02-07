import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/supabase/admin';
import { randomBytes, createHash } from 'crypto';

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, profile } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  // Generate new key
  const rawKey = `ccd_${randomBytes(32).toString('hex')}`;
  const keyPrefix = rawKey.substring(0, 12);
  const keyHash = createHash('sha256').update(rawKey).digest('hex');

  const { data: apiKey, error: updateError } = await supabase
    .from('api_keys')
    .update({
      key_prefix: keyPrefix,
      key_hash: keyHash,
    })
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .eq('is_active', true)
    .select('id, name, key_prefix, scopes, is_active, expires_at, created_at')
    .single();

  if (updateError || !apiKey) {
    return NextResponse.json(
      { success: false, error: { message: updateError?.message ?? 'Key not found' } },
      { status: 404 }
    );
  }

  // Log activity
  await supabase.from('activity_logs').insert({
    tenant_id: profile.tenant_id,
    user_id: profile.id,
    action: 'api_key.rotated',
    resource_type: 'api_key',
    resource_id: id,
    details: { name: apiKey.name },
  });

  return NextResponse.json({
    success: true,
    data: { ...apiKey, key: rawKey },
  });
}
