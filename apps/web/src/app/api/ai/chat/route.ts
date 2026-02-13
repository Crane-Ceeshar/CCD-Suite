import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error } from '@/lib/api/responses';
import { redisRateLimit } from '@/lib/api/redis-rate-limit';
import { RATE_LIMIT_PRESETS } from '@/lib/api/rate-limit';
import { checkTokenBudget, trackTokenUsage, isFeatureEnabled, getAiSettings } from '@/lib/api/ai-tokens';

const GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:4000';

export async function POST(request: NextRequest) {
  const { error: authErr, supabase, user, profile } = await requireAuth();
  if (authErr) return authErr;

  const { limited, response } = await redisRateLimit(user.id, RATE_LIMIT_PRESETS.api);
  if (limited) return response!;

  // Check feature enabled
  const chatEnabled = await isFeatureEnabled(supabase, profile.tenant_id, 'chat');
  if (!chatEnabled) {
    return error('AI Chat is not enabled for your organization', 403);
  }

  // Check token budget
  const budget = await checkTokenBudget(supabase, profile.tenant_id);
  if (!budget.allowed) {
    return error('Monthly AI token budget exceeded. Contact your administrator.', 429);
  }

  let body: {
    content?: string;
    conversation_id?: string;
    module_context?: string;
    entity_context?: { entity_type: string; entity_id: string; entity_data?: Record<string, unknown> };
  };
  try {
    body = await request.json();
  } catch {
    return error('Invalid JSON body', 400);
  }

  if (!body.content?.trim()) {
    return error('Message content is required', 400);
  }

  const content = body.content.trim();
  let conversationId = body.conversation_id;

  // Create or verify conversation
  if (!conversationId) {
    // Create new conversation
    const title = content.length > 50 ? content.substring(0, 47) + '...' : content;
    const { data: conv, error: convErr } = await supabase
      .from('ai_conversations')
      .insert({
        tenant_id: profile.tenant_id,
        user_id: user.id,
        title,
        module_context: body.module_context ?? null,
        metadata: body.entity_context ? { entity_context: body.entity_context } : {},
      })
      .select('id')
      .single();

    if (convErr) {
      return error('Failed to create conversation', 500);
    }
    conversationId = conv.id;
  } else {
    // Verify conversation belongs to user
    const { data: existing } = await supabase
      .from('ai_conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .eq('tenant_id', profile.tenant_id)
      .single();

    if (!existing) {
      return error('Conversation not found', 404);
    }
  }

  // Save user message to DB
  const { error: userMsgErr } = await supabase
    .from('ai_messages')
    .insert({
      conversation_id: conversationId,
      role: 'user',
      content,
      metadata: body.entity_context ? { entity_context: body.entity_context } : {},
    });

  if (userMsgErr) {
    return error('Failed to save message', 500);
  }

  // Load recent conversation history for context (last 20 messages)
  const { data: history } = await supabase
    .from('ai_messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(20);

  // Fetch tenant AI settings for system prompt and model preference
  const aiSettings = await getAiSettings(supabase, profile.tenant_id);

  // --- RAG: Knowledge Base Context Injection ---
  let ragContext = '';
  try {
    // Check if tenant has any ready KB docs before doing embedding call
    const { count: kbCount } = await supabase
      .from('ai_knowledge_base')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', profile.tenant_id)
      .eq('status', 'ready');

    if (kbCount && kbCount > 0) {
      const { data: { session: embedSession } } = await supabase.auth.getSession();

      // Generate embedding for the user's message
      const embedRes = await fetch(`${GATEWAY_URL}/api/ai/embed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(embedSession?.access_token ? { Authorization: `Bearer ${embedSession.access_token}` } : {}),
        },
        body: JSON.stringify({ text: content }),
      });

      if (embedRes.ok) {
        const embedData = await embedRes.json();
        const queryEmbedding = embedData.embedding ?? embedData.data?.[0]?.embedding;

        if (queryEmbedding && Array.isArray(queryEmbedding)) {
          const { data: matches } = await supabase.rpc('match_ai_embeddings', {
            query_embedding: JSON.stringify(queryEmbedding),
            p_tenant_id: profile.tenant_id,
            match_count: 5,
            match_threshold: 0.7,
          });

          if (matches && matches.length > 0) {
            const contextChunks = matches
              .map((m: { content: string }) => `---\n${m.content}\n---`)
              .join('\n');
            ragContext = `[Knowledge Base Context]\nThe following information from the knowledge base may be relevant:\n${contextChunks}\nUse this context to inform your response when relevant, but don't mention the knowledge base explicitly.\n[End Knowledge Base Context]\n\n`;
          }
        }
      }
    }
  } catch {
    // RAG failures should not block chat
  }

  // Call AI gateway
  let aiResponse: { content: string; model: string; tokens_used: number | null };
  try {
    const { data: { session } } = await supabase.auth.getSession();

    // Build messages array with optional system prompt + RAG context
    const messages: { role: string; content: string }[] = [];
    const systemContent = [ragContext, aiSettings.system_prompt ?? ''].filter(Boolean).join('\n');
    if (systemContent) {
      messages.push({ role: 'system', content: systemContent });
    }
    messages.push(
      ...(history ?? []).map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      }))
    );

    const gatewayBody: Record<string, unknown> = {
      messages,
      module_context: body.module_context,
      entity_context: body.entity_context,
      model: aiSettings.preferred_model,
    };

    const res = await fetch(`${GATEWAY_URL}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify(gatewayBody),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return error(
        (errData as any)?.error?.message || 'AI service returned an error',
        res.status >= 500 ? 503 : res.status
      );
    }

    const data = await res.json();
    aiResponse = {
      content: data.message?.content ?? data.content ?? data.text ?? 'I could not generate a response.',
      model: data.message?.model ?? data.model ?? 'unknown',
      tokens_used: data.message?.tokens_used ?? data.tokens_used ?? null,
    };
  } catch {
    return error('AI service unavailable. Please ensure the AI gateway is running.', 503);
  }

  // Save assistant message to DB
  await supabase
    .from('ai_messages')
    .insert({
      conversation_id: conversationId,
      role: 'assistant',
      content: aiResponse.content,
      model: aiResponse.model,
      tokens_used: aiResponse.tokens_used,
      metadata: {},
    });

  // Track token usage (fire-and-forget)
  if (aiResponse.tokens_used && aiResponse.tokens_used > 0) {
    trackTokenUsage(supabase, profile.tenant_id, aiResponse.tokens_used, user.id, aiResponse.model, 'chat').catch(() => {});
  }

  // Update conversation's updated_at timestamp
  await supabase
    .from('ai_conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  return success({
    conversation_id: conversationId,
    message: {
      role: 'assistant',
      content: aiResponse.content,
      model: aiResponse.model,
      tokens_used: aiResponse.tokens_used,
    },
  });
}
