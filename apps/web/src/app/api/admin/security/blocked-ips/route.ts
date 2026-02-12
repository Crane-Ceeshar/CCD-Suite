import { NextRequest } from 'next/server';
import { requireAdmin, createAdminServiceClient } from '@/lib/supabase/admin';
import { success, error, dbError } from '@/lib/api/responses';
import { rateLimit, RATE_LIMIT_PRESETS } from '@/lib/api/rate-limit';

export async function GET(request: NextRequest) {
  const { error: authErr, user, profile } = await requireAdmin();
  if (authErr) return authErr;

  const { limited, response } = rateLimit(user.id, RATE_LIMIT_PRESETS.admin);
  if (limited) return response!;

  const serviceClient = createAdminServiceClient();
  const { searchParams } = new URL(request.url);
  const isActive = searchParams.get('is_active');

  let query = serviceClient
    .from('blocked_ips')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
    .order('blocked_at', { ascending: false });

  if (isActive === 'true') query = query.eq('is_active', true);
  if (isActive === 'false') query = query.eq('is_active', false);

  const { data, error: queryErr } = await query;

  if (queryErr) return dbError(queryErr, 'Failed to fetch blocked IPs');

  return success(data ?? []);
}

export async function POST(request: NextRequest) {
  const { error: authErr, user, profile } = await requireAdmin();
  if (authErr) return authErr;

  const { limited, response } = rateLimit(user.id, RATE_LIMIT_PRESETS.admin);
  if (limited) return response!;

  let body: { ip_address: string; reason?: string; expires_at?: string };
  try {
    body = await request.json();
  } catch {
    return error('Invalid JSON body', 400);
  }

  if (!body.ip_address || typeof body.ip_address !== 'string') {
    return error('ip_address is required', 400);
  }

  // Basic IP format validation (IPv4 or IPv6 or CIDR)
  const ipPattern = /^[\d.:/a-fA-F]+$/;
  if (!ipPattern.test(body.ip_address)) {
    return error('Invalid IP address format', 400);
  }

  const serviceClient = createAdminServiceClient();

  const { data, error: insertErr } = await serviceClient
    .from('blocked_ips')
    .insert({
      tenant_id: profile.tenant_id,
      ip_address: body.ip_address,
      reason: body.reason ?? null,
      expires_at: body.expires_at ?? null,
      blocked_by: user.id,
      is_active: true,
    })
    .select('*')
    .single();

  if (insertErr) return dbError(insertErr, 'Failed to block IP');

  return success(data, 201);
}
