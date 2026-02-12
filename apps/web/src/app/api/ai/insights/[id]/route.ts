import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error, notFound } from '@/lib/api/responses';
import { redisRateLimit } from '@/lib/api/redis-rate-limit';
import { RATE_LIMIT_PRESETS } from '@/lib/api/rate-limit';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authErr, supabase, user, profile } = await requireAuth();
  if (authErr) return authErr;

  const { limited, response } = await redisRateLimit(user.id, RATE_LIMIT_PRESETS.api);
  if (limited) return response!;

  const { id } = await params;

  const { data, error: queryErr } = await supabase
    .from('ai_insights')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .single();

  if (queryErr) {
    if (queryErr.code === 'PGRST116') return notFound('Insight');
    return error('Failed to fetch insight', 500);
  }

  return success(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authErr, supabase, user, profile } = await requireAuth();
  if (authErr) return authErr;

  const { limited, response } = await redisRateLimit(user.id, RATE_LIMIT_PRESETS.api);
  if (limited) return response!;

  const { id } = await params;

  let body: { is_read?: boolean };
  try {
    body = await request.json();
  } catch {
    return error('Invalid JSON body', 400);
  }

  const updateData: Record<string, unknown> = {};
  if (typeof body.is_read === 'boolean') updateData.is_read = body.is_read;

  if (Object.keys(updateData).length === 0) {
    return error('No fields to update', 400);
  }

  const { data, error: updateErr } = await supabase
    .from('ai_insights')
    .update(updateData)
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .select('*')
    .single();

  if (updateErr) {
    if (updateErr.code === 'PGRST116') return notFound('Insight');
    return error('Failed to update insight', 500);
  }

  return success(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authErr, supabase, user, profile } = await requireAuth();
  if (authErr) return authErr;

  const { limited, response } = await redisRateLimit(user.id, RATE_LIMIT_PRESETS.api);
  if (limited) return response!;

  const { id } = await params;

  const { error: deleteErr } = await supabase
    .from('ai_insights')
    .delete()
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id);

  if (deleteErr) {
    return error('Failed to delete insight', 500);
  }

  return success({ deleted: true });
}
