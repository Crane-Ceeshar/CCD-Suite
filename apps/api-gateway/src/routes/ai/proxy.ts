import type { FastifyInstance } from 'fastify';

const AI_SERVICES_URL = process.env.AI_SERVICES_URL || 'http://localhost:5100';

interface ChatBody {
  content: string;
  conversation_id?: string;
  module_context?: string;
  entity_context?: { entity_type: string; entity_id: string; entity_data?: Record<string, unknown> };
  max_tokens?: number;
}

interface GenerateBody {
  type: string;
  prompt: string;
  context?: Record<string, unknown>;
  max_tokens?: number;
}

interface AnalyzeBody {
  text: string;
  analyses: string[];
  context?: Record<string, unknown>;
}

interface InsightsBody {
  category: string;
  additional_context?: string;
}

export async function proxyRoutes(fastify: FastifyInstance) {

  // ----------------------------------------------------------------
  // Chat (non-streaming) — forward to AI services, persist messages
  // ----------------------------------------------------------------
  fastify.post<{ Body: ChatBody }>('/chat', async (request, reply) => {
    const { content, conversation_id, module_context, entity_context, max_tokens } = request.body;

    // Get or create conversation
    let convId = conversation_id;
    if (!convId) {
      const { data: conv, error: convErr } = await fastify.supabase
        .from('ai_conversations')
        .insert({
          tenant_id: request.tenantId,
          user_id: request.userId,
          module_context: module_context ?? null,
          metadata: {},
        })
        .select()
        .single();
      if (convErr) throw convErr;
      convId = conv.id;
    }

    // Fetch existing messages for context
    const { data: existingMessages } = await fastify.supabase
      .from('ai_messages')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(50);

    const messages = [
      ...(existingMessages ?? []).map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content },
    ];

    // Save user message
    await fastify.supabase
      .from('ai_messages')
      .insert({
        conversation_id: convId,
        role: 'user',
        content,
        metadata: {},
      });

    // Forward to AI services
    const aiResp = await fetch(`${AI_SERVICES_URL}/api/ai/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, module_context, entity_context, max_tokens }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      reply.status(aiResp.status).send({
        success: false,
        error: { code: 'AI_SERVICE_ERROR', message: errText },
      });
      return;
    }

    const aiData = await aiResp.json() as {
      content: string;
      model: string;
      tokens_used: number | null;
    };

    // Save assistant message
    await fastify.supabase
      .from('ai_messages')
      .insert({
        conversation_id: convId,
        role: 'assistant',
        content: aiData.content,
        model: aiData.model,
        tokens_used: aiData.tokens_used,
        metadata: {},
      });

    // Auto-title conversation if it's the first message
    if (!conversation_id) {
      const title = content.length > 60 ? content.substring(0, 57) + '...' : content;
      await fastify.supabase
        .from('ai_conversations')
        .update({ title })
        .eq('id', convId);
    }

    return {
      success: true,
      data: {
        conversation_id: convId,
        message: {
          role: 'assistant',
          content: aiData.content,
          model: aiData.model,
          tokens_used: aiData.tokens_used,
        },
      },
    };
  });

  // ----------------------------------------------------------------
  // Chat stream (SSE) — proxy SSE from AI services, save on done
  // ----------------------------------------------------------------
  fastify.post<{ Body: ChatBody }>('/chat/stream', async (request, reply) => {
    const { content, conversation_id, module_context, entity_context, max_tokens } = request.body;

    // Get or create conversation
    let convId = conversation_id;
    if (!convId) {
      const { data: conv, error: convErr } = await fastify.supabase
        .from('ai_conversations')
        .insert({
          tenant_id: request.tenantId,
          user_id: request.userId,
          module_context: module_context ?? null,
          metadata: {},
        })
        .select()
        .single();
      if (convErr) throw convErr;
      convId = conv.id;
    }

    // Fetch existing messages for context
    const { data: existingMessages } = await fastify.supabase
      .from('ai_messages')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(50);

    const messages = [
      ...(existingMessages ?? []).map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content },
    ];

    // Save user message
    await fastify.supabase
      .from('ai_messages')
      .insert({ conversation_id: convId, role: 'user', content, metadata: {} });

    // Forward to AI services SSE endpoint
    const aiResp = await fetch(`${AI_SERVICES_URL}/api/ai/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, module_context, entity_context, max_tokens }),
    });

    if (!aiResp.ok || !aiResp.body) {
      const errText = await aiResp.text();
      reply.status(aiResp.status).send({
        success: false,
        error: { code: 'AI_SERVICE_ERROR', message: errText },
      });
      return;
    }

    // Set SSE headers
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Conversation-Id': convId,
    });

    let fullContent = '';
    let model = '';
    let tokensUsed: number | null = null;

    const reader = aiResp.body.getReader();
    const decoder = new TextDecoder();

    try {
      let reading = true;
      while (reading) {
        const { done, value } = await reader.read();
        if (done) { reading = false; break; }

        const chunk = decoder.decode(value, { stream: true });
        reply.raw.write(chunk);

        // Parse SSE events to accumulate content
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('event: text')) {
            // Next data line is text content
            const dataLine = lines[lines.indexOf(line) + 1];
            if (dataLine?.startsWith('data:')) {
              fullContent += dataLine.slice(5).trim();
            }
          }
          if (line.startsWith('event: done')) {
            const dataLine = lines[lines.indexOf(line) + 1];
            if (dataLine?.startsWith('data:')) {
              try {
                const meta = JSON.parse(dataLine.slice(5).trim());
                model = meta.model ?? '';
                tokensUsed = meta.tokens_used ?? null;
              } catch { /* ignore parse errors */ }
            }
          }
        }
      }
    } finally {
      // Save assistant message after stream ends
      if (fullContent) {
        await fastify.supabase
          .from('ai_messages')
          .insert({
            conversation_id: convId,
            role: 'assistant',
            content: fullContent,
            model: model || null,
            tokens_used: tokensUsed,
            metadata: {},
          });
      }

      // Auto-title if new conversation
      if (!conversation_id) {
        const title = content.length > 60 ? content.substring(0, 57) + '...' : content;
        await fastify.supabase
          .from('ai_conversations')
          .update({ title })
          .eq('id', convId);
      }

      reply.raw.end();
    }
  });

  // ----------------------------------------------------------------
  // Generate — forward and save as generation job
  // ----------------------------------------------------------------
  fastify.post<{ Body: GenerateBody }>('/generate', async (request, reply) => {
    const { type, prompt, context, max_tokens } = request.body;

    // Create generation job
    const { data: job, error: jobErr } = await fastify.supabase
      .from('ai_generation_jobs')
      .insert({
        tenant_id: request.tenantId,
        user_id: request.userId,
        type,
        prompt,
        status: 'processing',
        metadata: context ?? {},
      })
      .select()
      .single();
    if (jobErr) throw jobErr;

    // Forward to AI services
    const aiResp = await fetch(`${AI_SERVICES_URL}/api/ai/generate/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, prompt, context, max_tokens }),
    });

    if (!aiResp.ok) {
      await fastify.supabase
        .from('ai_generation_jobs')
        .update({ status: 'failed' })
        .eq('id', job.id);

      const errText = await aiResp.text();
      reply.status(aiResp.status).send({
        success: false,
        error: { code: 'AI_SERVICE_ERROR', message: errText },
      });
      return;
    }

    const aiData = await aiResp.json() as {
      content: string;
      model: string;
      tokens_used: number | null;
    };

    // Update job with result
    const { data: updated } = await fastify.supabase
      .from('ai_generation_jobs')
      .update({
        result: aiData.content,
        status: 'completed',
        model: aiData.model,
        tokens_used: aiData.tokens_used,
      })
      .eq('id', job.id)
      .select()
      .single();

    return { success: true, data: updated };
  });

  // ----------------------------------------------------------------
  // Analyze — forward analysis request
  // ----------------------------------------------------------------
  fastify.post<{ Body: AnalyzeBody }>('/analyze', async (request, reply) => {
    const aiResp = await fetch(`${AI_SERVICES_URL}/api/ai/analyze/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request.body),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      reply.status(aiResp.status).send({
        success: false,
        error: { code: 'AI_SERVICE_ERROR', message: errText },
      });
      return;
    }

    const data = await aiResp.json();
    return { success: true, data };
  });

  // ----------------------------------------------------------------
  // Insights — forward and persist
  // ----------------------------------------------------------------
  fastify.post<{ Body: InsightsBody }>('/insights', async (request, reply) => {
    const { category, additional_context } = request.body;

    const aiResp = await fetch(`${AI_SERVICES_URL}/api/ai/insights/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_id: request.tenantId,
        category,
        additional_context,
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      reply.status(aiResp.status).send({
        success: false,
        error: { code: 'AI_SERVICE_ERROR', message: errText },
      });
      return;
    }

    const aiData = await aiResp.json() as {
      insights: Array<{ title: string; summary: string; type: string; details: Record<string, unknown> }>;
      category: string;
    };

    // Persist insights
    if (aiData.insights?.length) {
      const rows = aiData.insights.map((insight) => ({
        tenant_id: request.tenantId,
        category,
        type: insight.type,
        title: insight.title,
        summary: insight.summary,
        details: insight.details,
      }));

      await fastify.supabase.from('ai_insights').insert(rows);
    }

    return { success: true, data: aiData };
  });

  // ----------------------------------------------------------------
  // List insights
  // ----------------------------------------------------------------
  fastify.get('/insights', async (request) => {
    const { data, error } = await fastify.supabase
      .from('ai_insights')
      .select('*')
      .eq('tenant_id', request.tenantId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return { success: true, data };
  });

  // ----------------------------------------------------------------
  // Get tenant AI settings
  // ----------------------------------------------------------------
  fastify.get('/settings', async (request) => {
    const { data, error } = await fastify.supabase
      .from('ai_settings')
      .select('*')
      .eq('tenant_id', request.tenantId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return { success: true, data: data ?? null };
  });

  // ----------------------------------------------------------------
  // List generation history
  // ----------------------------------------------------------------
  fastify.get('/generations', async (request) => {
    const { data, error } = await fastify.supabase
      .from('ai_generation_jobs')
      .select('*')
      .eq('tenant_id', request.tenantId)
      .eq('user_id', request.userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return { success: true, data };
  });
}
