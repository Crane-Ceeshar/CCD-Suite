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

  const { data, error: queryError } = await supabase
    .from('ai_conversations')
    .select('*, ai_messages(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { referencedTable: 'ai_messages', ascending: true })
    .single();

  if (queryError) {
    if (queryError.code === 'PGRST116') return notFound('Conversation');
    return dbError(queryError, 'Conversation');
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
  const body = await request.json();

  const updateFields: Record<string, unknown> = {};
  if (body.title !== undefined) updateFields.title = body.title;
  if (body.status !== undefined) {
    if (body.status !== 'active' && body.status !== 'archived') {
      return error('Status must be "active" or "archived"', 400);
    }
    updateFields.status = body.status;
  }

  if (Object.keys(updateFields).length === 0) {
    return error('No valid fields to update', 400);
  }

  const { data, error: updateError } = await supabase
    .from('ai_conversations')
    .update(updateFields)
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('tenant_id', profile.tenant_id)
    .select('id, title, module_context, status, metadata, created_at, updated_at')
    .single();

  if (updateError) return dbError(updateError, 'Conversation');

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

  const { error: deleteError } = await supabase
    .from('ai_conversations')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('tenant_id', profile.tenant_id);

  if (deleteError) return dbError(deleteError, 'Conversation');

  return success({ deleted: true });
}
