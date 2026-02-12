import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error, dbError } from '@/lib/api/responses';
import { redisRateLimit } from '@/lib/api/redis-rate-limit';
import { RATE_LIMIT_PRESETS } from '@/lib/api/rate-limit';

export async function GET(request: NextRequest) {
  const { error: authErr, supabase, user, profile } = await requireAuth();
  if (authErr) return authErr;

  const { limited, response } = await redisRateLimit(user.id, RATE_LIMIT_PRESETS.api);
  if (limited) return response!;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? 'active';
  const limit = parseInt(searchParams.get('limit') ?? '50', 10);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);

  const { data, error: queryError } = await supabase
    .from('ai_conversations')
    .select('id, title, module_context, status, metadata, created_at, updated_at')
    .eq('user_id', user.id)
    .eq('tenant_id', profile.tenant_id)
    .eq('status', status)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (queryError) return dbError(queryError, 'Failed to load conversations');

  return success(data);
}

export async function POST(request: NextRequest) {
  const { error: authErr, supabase, user, profile } = await requireAuth();
  if (authErr) return authErr;

  const { limited, response } = await redisRateLimit(user.id, RATE_LIMIT_PRESETS.api);
  if (limited) return response!;

  const body = await request.json();
  const { title, module_context, metadata } = body as {
    title?: string;
    module_context?: string;
    metadata?: object;
  };

  if (!title && !module_context && !metadata) {
    return error('At least one of title, module_context, or metadata must be provided', 400);
  }

  const { data, error: insertError } = await supabase
    .from('ai_conversations')
    .insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      title: title ?? null,
      module_context: module_context ?? null,
      metadata: metadata ?? null,
    })
    .select('id, title, module_context, status, metadata, created_at, updated_at')
    .single();

  if (insertError) return dbError(insertError, 'Failed to create conversation');

  return success(data, 201);
}
