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
  const search = searchParams.get('search');
  const type = searchParams.get('type');
  const favorites = searchParams.get('favorites');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const offset = (page - 1) * limit;

  let query = supabase
    .from('ai_content_library')
    .select('*', { count: 'exact' })
    .eq('tenant_id', profile.tenant_id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
  }

  if (type) {
    query = query.eq('type', type);
  }

  if (favorites === 'true') {
    query = query.eq('is_favorite', true);
  }

  const { data, count, error: queryErr } = await query;

  if (queryErr) return dbError(queryErr, 'Failed to fetch content library');

  return success({
    items: data ?? [],
    total: count ?? 0,
    page,
    limit,
    total_pages: Math.ceil((count ?? 0) / limit),
  });
}

export async function POST(request: NextRequest) {
  const { error: authErr, supabase, user, profile } = await requireAuth();
  if (authErr) return authErr;

  const { limited, response } = await redisRateLimit(user.id, RATE_LIMIT_PRESETS.api);
  if (limited) return response!;

  let body: {
    title: string;
    content: string;
    type?: string;
    prompt?: string;
    tags?: string[];
    model?: string;
    tokens_used?: number;
    generation_job_id?: string;
    metadata?: Record<string, unknown>;
  };
  try {
    body = await request.json();
  } catch {
    return error('Invalid JSON body', 400);
  }

  if (!body.title || !body.title.trim()) {
    return error('title is required', 400);
  }

  if (!body.content || !body.content.trim()) {
    return error('content is required', 400);
  }

  const { data, error: insertErr } = await supabase
    .from('ai_content_library')
    .insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      title: body.title.trim(),
      content: body.content.trim(),
      type: body.type ?? 'custom',
      prompt: body.prompt ?? '',
      tags: body.tags ?? [],
      model: body.model ?? null,
      tokens_used: body.tokens_used ?? null,
      generation_job_id: body.generation_job_id ?? null,
      metadata: body.metadata ?? {},
    })
    .select('*')
    .single();

  if (insertErr) return dbError(insertErr, 'Failed to save content');

  return success(data, 201);
}
