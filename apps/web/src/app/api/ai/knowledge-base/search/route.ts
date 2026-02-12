import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error } from '@/lib/api/responses';
import { redisRateLimit } from '@/lib/api/redis-rate-limit';
import { RATE_LIMIT_PRESETS } from '@/lib/api/rate-limit';
import { isFeatureEnabled } from '@/lib/api/ai-tokens';

const GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:4000';

/**
 * POST /api/ai/knowledge-base/search
 * Perform vector similarity search against the knowledge base.
 * Accepts { query: string, count?: number, threshold?: number }
 */
export async function POST(request: NextRequest) {
  const { error: authErr, supabase, user, profile } = await requireAuth();
  if (authErr) return authErr;

  const { limited, response } = await redisRateLimit(user.id, RATE_LIMIT_PRESETS.api);
  if (limited) return response!;

  // Check feature enabled
  const chatEnabled = await isFeatureEnabled(supabase, profile.tenant_id, 'chat');
  if (!chatEnabled) {
    return error('AI Chat / Knowledge Base is not enabled for your organization', 403);
  }

  let body: { query?: string; count?: number; threshold?: number };
  try {
    body = await request.json();
  } catch {
    return error('Invalid JSON body', 400);
  }

  if (!body.query?.trim()) {
    return error('Query is required', 400);
  }

  const query = body.query.trim();
  const matchCount = body.count ?? 5;
  const matchThreshold = body.threshold ?? 0.7;

  // Generate query embedding via gateway
  let queryEmbedding: number[];
  try {
    const { data: { session } } = await supabase.auth.getSession();

    const embedRes = await fetch(`${GATEWAY_URL}/ai/embed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ text: query }),
    });

    if (!embedRes.ok) {
      return error('Failed to generate query embedding', 503);
    }

    const embedData = await embedRes.json();
    queryEmbedding = embedData.embedding ?? embedData.data?.[0]?.embedding;

    if (!queryEmbedding || !Array.isArray(queryEmbedding)) {
      return error('Invalid embedding response from AI service', 503);
    }
  } catch {
    return error('AI embedding service unavailable', 503);
  }

  // Call match_ai_embeddings RPC
  const { data: matches, error: rpcErr } = await supabase.rpc('match_ai_embeddings', {
    query_embedding: JSON.stringify(queryEmbedding),
    p_tenant_id: profile.tenant_id,
    match_count: matchCount,
    match_threshold: matchThreshold,
  });

  if (rpcErr) {
    console.error('match_ai_embeddings RPC error:', rpcErr.message);
    return error('Failed to search knowledge base', 500);
  }

  return success({ results: matches ?? [], query });
}
