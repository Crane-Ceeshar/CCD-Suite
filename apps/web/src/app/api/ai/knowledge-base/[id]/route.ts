import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error, notFound, dbError } from '@/lib/api/responses';
import { redisRateLimit } from '@/lib/api/redis-rate-limit';
import { RATE_LIMIT_PRESETS } from '@/lib/api/rate-limit';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/ai/knowledge-base/[id]
 * Fetch a single knowledge base document by id, tenant-scoped.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const { error: authErr, supabase, user, profile } = await requireAuth();
  if (authErr) return authErr;

  const { limited, response } = await redisRateLimit(user.id, RATE_LIMIT_PRESETS.api);
  if (limited) return response!;

  const { id } = await context.params;

  const { data, error: queryErr } = await supabase
    .from('ai_knowledge_base')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .single();

  if (queryErr) {
    return dbError(queryErr, 'Knowledge base document');
  }
  if (!data) {
    return notFound('Knowledge base document');
  }

  return success(data);
}

/**
 * PATCH /api/ai/knowledge-base/[id]
 * Update title or description of a knowledge base document.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { error: authErr, supabase, user, profile } = await requireAuth();
  if (authErr) return authErr;

  const { limited, response } = await redisRateLimit(user.id, RATE_LIMIT_PRESETS.api);
  if (limited) return response!;

  const { id } = await context.params;

  let body: { title?: string; description?: string };
  try {
    body = await request.json();
  } catch {
    return error('Invalid JSON body', 400);
  }

  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title.trim();
  if (body.description !== undefined) updates.description = body.description.trim();

  if (Object.keys(updates).length === 0) {
    return error('No valid fields to update', 400);
  }

  const { data, error: updateErr } = await supabase
    .from('ai_knowledge_base')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .select('*')
    .single();

  if (updateErr) {
    return dbError(updateErr, 'Knowledge base document');
  }
  if (!data) {
    return notFound('Knowledge base document');
  }

  return success(data);
}

/**
 * DELETE /api/ai/knowledge-base/[id]
 * Delete a knowledge base document (cascades to embeddings).
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { error: authErr, supabase, user, profile } = await requireAuth();
  if (authErr) return authErr;

  const { limited, response } = await redisRateLimit(user.id, RATE_LIMIT_PRESETS.api);
  if (limited) return response!;

  const { id } = await context.params;

  const { error: deleteErr } = await supabase
    .from('ai_knowledge_base')
    .delete()
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id);

  if (deleteErr) {
    return dbError(deleteErr, 'Failed to delete knowledge base document');
  }

  return success({ deleted: true });
}
