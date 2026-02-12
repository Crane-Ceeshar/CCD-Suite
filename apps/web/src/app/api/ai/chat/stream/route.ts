import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { redisRateLimit } from '@/lib/api/redis-rate-limit';
import { RATE_LIMIT_PRESETS } from '@/lib/api/rate-limit';
import { checkTokenBudget, trackTokenUsage, isFeatureEnabled, getAiSettings } from '@/lib/api/ai-tokens';

const GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:4000';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const { error: authErr, supabase, user, profile } = await requireAuth();
  if (authErr) return authErr;

  const { limited, response } = await redisRateLimit(user.id, RATE_LIMIT_PRESETS.ai);
  if (limited) return response!;

  // Check feature enabled
  const chatEnabled = await isFeatureEnabled(supabase, profile.tenant_id, 'chat');
  if (!chatEnabled) {
    return new Response(
      JSON.stringify({ success: false, error: { message: 'AI Chat is not enabled for your organization' } }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Check token budget
  const budget = await checkTokenBudget(supabase, profile.tenant_id);
  if (!budget.allowed) {
    return new Response(
      JSON.stringify({ success: false, error: { message: 'Monthly AI token budget exceeded.' } }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
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
    return new Response(
      JSON.stringify({ success: false, error: { message: 'Invalid JSON body' } }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!body.content?.trim()) {
    return new Response(
      JSON.stringify({ success: false, error: { message: 'Message content is required' } }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const content = body.content.trim();
  let conversationId = body.conversation_id;

  // Create or verify conversation
  if (!conversationId) {
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
      return new Response(
        JSON.stringify({ success: false, error: { message: 'Failed to create conversation' } }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    conversationId = conv.id;
  } else {
    const { data: existing } = await supabase
      .from('ai_conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .eq('tenant_id', profile.tenant_id)
      .single();

    if (!existing) {
      return new Response(
        JSON.stringify({ success: false, error: { message: 'Conversation not found' } }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
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
    return new Response(
      JSON.stringify({ success: false, error: { message: 'Failed to save message' } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Load conversation history for context (last 20 messages)
  const { data: history } = await supabase
    .from('ai_messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(20);

  // Fetch tenant AI settings for system prompt and model preference
  const aiSettings = await getAiSettings(supabase, profile.tenant_id);

  // Get session token for gateway auth
  const { data: { session } } = await supabase.auth.getSession();

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
      // Generate embedding for the user's message
      const embedRes = await fetch(`${GATEWAY_URL}/ai/embed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
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

  // Build messages array with optional system prompt + RAG context
  const chatMessages: { role: string; content: string }[] = [];
  const systemContent = [ragContext, aiSettings.system_prompt ?? ''].filter(Boolean).join('\n');
  if (systemContent) {
    chatMessages.push({ role: 'system', content: systemContent });
  }
  chatMessages.push(
    ...(history ?? []).map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    }))
  );

  // Build gateway request
  const gatewayBody: Record<string, unknown> = {
    messages: chatMessages,
    module_context: body.module_context,
    entity_context: body.entity_context,
    model: aiSettings.preferred_model,
    stream: true,
  };

  // Create the SSE stream
  const encoder = new TextEncoder();
  const savedConversationId = conversationId;
  const tenantId = profile.tenant_id;
  const userId = user.id;

  // Capture supabase client reference for use in the stream
  const db = supabase;

  const stream = new ReadableStream({
    async start(controller) {
      let accumulatedContent = '';
      let model = 'unknown';
      let tokensUsed: number | null = null;

      function sendSSE(event: string, data: string) {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
      }

      try {
        const gatewayRes = await fetch(`${GATEWAY_URL}/ai/chat/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify(gatewayBody),
        });

        if (!gatewayRes.ok || !gatewayRes.body) {
          // Gateway returned an error — fall back to non-streaming gateway
          const fallbackRes = await fetch(`${GATEWAY_URL}/ai/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
            },
            body: JSON.stringify({ ...gatewayBody, stream: false }),
          });

          if (!fallbackRes.ok) {
            sendSSE('error', 'AI service returned an error');
            controller.close();
            return;
          }

          const fallbackData = await fallbackRes.json();
          const fallbackContent =
            fallbackData.message?.content ?? fallbackData.content ?? fallbackData.text ?? 'I could not generate a response.';
          model = fallbackData.message?.model ?? fallbackData.model ?? 'unknown';
          tokensUsed = fallbackData.message?.tokens_used ?? fallbackData.tokens_used ?? null;

          // Send full content as a single text event
          sendSSE('text', fallbackContent);
          accumulatedContent = fallbackContent;

          // Persist assistant message
          await db
            .from('ai_messages')
            .insert({
              conversation_id: savedConversationId,
              role: 'assistant',
              content: accumulatedContent,
              model,
              tokens_used: tokensUsed,
              metadata: {},
            });

          // Track token usage
          if (tokensUsed && tokensUsed > 0) {
            trackTokenUsage(db, tenantId, tokensUsed, userId, model, 'chat').catch(() => {});
          }

          // Update conversation timestamp
          await db
            .from('ai_conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', savedConversationId);

          sendSSE('done', JSON.stringify({
            model,
            tokens_used: tokensUsed,
            conversation_id: savedConversationId,
          }));
          controller.close();
          return;
        }

        // Stream from the gateway
        const reader = gatewayRes.body.getReader();
        const decoder = new TextDecoder();
        let currentEvent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('event:')) {
              currentEvent = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
              const data = line.slice(5).trim();

              if (currentEvent === 'text') {
                accumulatedContent += data;
                sendSSE('text', data);
              } else if (currentEvent === 'done') {
                try {
                  const meta = JSON.parse(data);
                  model = meta.model ?? 'unknown';
                  tokensUsed = meta.tokens_used ?? null;
                } catch { /* ignore parse error */ }
              } else if (currentEvent === 'error') {
                sendSSE('error', data);
              }
            }
          }
        }

        // After stream ends, persist assistant message
        if (accumulatedContent) {
          await db
            .from('ai_messages')
            .insert({
              conversation_id: savedConversationId,
              role: 'assistant',
              content: accumulatedContent,
              model,
              tokens_used: tokensUsed,
              metadata: {},
            });
        }

        // Track token usage
        if (tokensUsed && tokensUsed > 0) {
          trackTokenUsage(db, tenantId, tokensUsed, userId, model, 'chat').catch(() => {});
        }

        // Update conversation timestamp
        await db
          .from('ai_conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', savedConversationId);

        sendSSE('done', JSON.stringify({
          model,
          tokens_used: tokensUsed,
          conversation_id: savedConversationId,
        }));
      } catch {
        sendSSE('error', 'AI service unavailable');
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
