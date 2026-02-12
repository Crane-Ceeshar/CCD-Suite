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
    .from('ai_automations')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .single();

  if (queryErr) return dbError(queryErr, 'AI automation');
  if (!data) return notFound('AI automation');

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

  let body: {
    name?: string;
    description?: string;
    is_enabled?: boolean;
    config?: object;
    schedule_type?: string;
    schedule_config?: object;
    next_run_at?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return error('Invalid JSON body', 400);
  }

  // Validate schedule_type if provided
  const validScheduleTypes = ['manual', 'daily', 'weekly', 'monthly'];
  if (body.schedule_type !== undefined && !validScheduleTypes.includes(body.schedule_type)) {
    return error(`Invalid schedule_type. Must be one of: ${validScheduleTypes.join(', ')}`, 400);
  }

  const updateFields: Record<string, unknown> = {};
  if (body.name !== undefined) updateFields.name = body.name;
  if (body.description !== undefined) updateFields.description = body.description;
  if (body.is_enabled !== undefined) updateFields.is_enabled = body.is_enabled;
  if (body.config !== undefined) updateFields.config = body.config;
  if (body.schedule_type !== undefined) updateFields.schedule_type = body.schedule_type;
  if (body.schedule_config !== undefined) updateFields.schedule_config = body.schedule_config;
  if (body.next_run_at !== undefined) updateFields.next_run_at = body.next_run_at;

  if (Object.keys(updateFields).length === 0) {
    return error('No fields to update', 400);
  }

  const { data, error: updateErr } = await supabase
    .from('ai_automations')
    .update(updateFields)
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .select('*')
    .single();

  if (updateErr) return dbError(updateErr, 'AI automation');

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
    .from('ai_automations')
    .delete()
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id);

  if (deleteErr) return dbError(deleteErr, 'AI automation');

  return success({ deleted: true });
}
