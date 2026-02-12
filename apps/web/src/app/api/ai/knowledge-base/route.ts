import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error, dbError } from '@/lib/api/responses';
import { redisRateLimit } from '@/lib/api/redis-rate-limit';
import { RATE_LIMIT_PRESETS } from '@/lib/api/rate-limit';
import { isFeatureEnabled } from '@/lib/api/ai-tokens';

/**
 * GET /api/ai/knowledge-base
 * List knowledge base documents for the current tenant.
 * Supports optional ?status= filter and pagination via ?limit= and ?offset=.
 */
export async function GET(request: NextRequest) {
  const { error: authErr, supabase, user, profile } = await requireAuth();
  if (authErr) return authErr;

  const { limited, response } = await redisRateLimit(user.id, RATE_LIMIT_PRESETS.api);
  if (limited) return response!;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') ?? '50', 10);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);

  let query = supabase
    .from('ai_knowledge_base')
    .select('*', { count: 'exact' })
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status && ['pending', 'processing', 'ready', 'failed'].includes(status)) {
    query = query.eq('status', status);
  }

  const { data, error: queryErr, count } = await query;

  if (queryErr) {
    return dbError(queryErr, 'Failed to fetch knowledge base documents');
  }

  return success({ documents: data ?? [], total: count ?? 0 });
}

/**
 * POST /api/ai/knowledge-base
 * Create a new knowledge base document record.
 * The file_url comes from a client-side Supabase Storage upload.
 */
export async function POST(request: NextRequest) {
  const { error: authErr, supabase, user, profile } = await requireAuth();
  if (authErr) return authErr;

  const { limited, response } = await redisRateLimit(user.id, RATE_LIMIT_PRESETS.api);
  if (limited) return response!;

  // Check feature enabled (KB enhances chat)
  const chatEnabled = await isFeatureEnabled(supabase, profile.tenant_id, 'chat');
  if (!chatEnabled) {
    return error('AI Chat / Knowledge Base is not enabled for your organization', 403);
  }

  let body: {
    title?: string;
    description?: string;
    file_name?: string;
    file_type?: string;
    file_size?: number;
    file_url?: string;
    metadata?: Record<string, unknown>;
  };
  try {
    body = await request.json();
  } catch {
    return error('Invalid JSON body', 400);
  }

  if (!body.title?.trim()) {
    return error('Title is required', 400);
  }
  if (!body.file_name?.trim()) {
    return error('File name is required', 400);
  }
  if (!body.file_type?.trim()) {
    return error('File type is required', 400);
  }

  const { data, error: insertErr } = await supabase
    .from('ai_knowledge_base')
    .insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      title: body.title.trim(),
      description: body.description?.trim() ?? '',
      file_name: body.file_name.trim(),
      file_type: body.file_type.trim(),
      file_size: body.file_size ?? 0,
      file_url: body.file_url ?? null,
      metadata: body.metadata ?? {},
      status: 'pending',
    })
    .select('*')
    .single();

  if (insertErr) {
    return dbError(insertErr, 'Failed to create knowledge base document');
  }

  return success(data, 201);
}
