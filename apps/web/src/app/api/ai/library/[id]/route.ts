import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error, notFound, dbError } from '@/lib/api/responses';
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
    .from('ai_content_library')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .eq('user_id', user.id)
    .single();

  if (queryErr) return dbError(queryErr, 'Content item');
  if (!data) return notFound('Content item');

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

  let body: { title?: string; tags?: string[]; is_favorite?: boolean };
  try {
    body = await request.json();
  } catch {
    return error('Invalid JSON body', 400);
  }

  const updateFields: Record<string, unknown> = {};
  if (body.title !== undefined) updateFields.title = body.title;
  if (body.tags !== undefined) updateFields.tags = body.tags;
  if (body.is_favorite !== undefined) updateFields.is_favorite = body.is_favorite;

  if (Object.keys(updateFields).length === 0) {
    return error('No fields to update', 400);
  }

  const { data, error: updateErr } = await supabase
    .from('ai_content_library')
    .update(updateFields)
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (updateErr) return dbError(updateErr, 'Content item');

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
    .from('ai_content_library')
    .delete()
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .eq('user_id', user.id);

  if (deleteErr) return dbError(deleteErr, 'Content item');

  return success({ deleted: true });
}
