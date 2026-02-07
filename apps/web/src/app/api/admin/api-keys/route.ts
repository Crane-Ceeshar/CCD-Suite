import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase/admin';
import { randomBytes, createHash } from 'crypto';

export async function GET() {
  const { error, supabase, profile } = await requireAdmin();
  if (error) return error;

  const { data: keys, error: queryError } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, scopes, is_active, last_used_at, expires_at, created_by, created_at')
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { ascending: false });

  if (queryError) {
    return NextResponse.json(
      { success: false, error: { message: queryError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: keys });
}

export async function POST(request: NextRequest) {
  const { error, supabase, profile } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const { name, scopes = [], expires_at = null } = body;

  if (!name?.trim()) {
    return NextResponse.json(
      { success: false, error: { message: 'Key name is required' } },
      { status: 400 }
    );
  }

  // Generate the API key
  const rawKey = `ccd_${randomBytes(32).toString('hex')}`;
  const keyPrefix = rawKey.substring(0, 12);
  const keyHash = createHash('sha256').update(rawKey).digest('hex');

  const { data: apiKey, error: insertError } = await supabase
    .from('api_keys')
    .insert({
      tenant_id: profile.tenant_id,
      name: name.trim(),
      key_prefix: keyPrefix,
      key_hash: keyHash,
      scopes,
      expires_at,
      created_by: profile.id,
    })
    .select('id, name, key_prefix, scopes, is_active, expires_at, created_at')
    .single();

  if (insertError || !apiKey) {
    return NextResponse.json(
      { success: false, error: { message: insertError?.message ?? 'Failed to create key' } },
      { status: 500 }
    );
  }

  // Log activity
  await supabase.from('activity_logs').insert({
    tenant_id: profile.tenant_id,
    user_id: profile.id,
    action: 'api_key.created',
    resource_type: 'api_key',
    resource_id: apiKey.id,
    details: { name: apiKey.name },
  });

  // Return the full key — this is the only time it's ever shown
  return NextResponse.json({
    success: true,
    data: { ...apiKey, key: rawKey },
  });
}
