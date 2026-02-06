import type { FastifyInstance } from 'fastify';

export async function conversationsRoutes(fastify: FastifyInstance) {
  // List conversations
  fastify.get('/', async (request) => {
    const { data, error } = await fastify.supabase
      .from('ai_conversations')
      .select('*')
      .eq('tenant_id', request.tenantId)
      .eq('user_id', request.userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  });

  // Get conversation with messages
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { data, error } = await fastify.supabase
      .from('ai_conversations')
      .select('*, ai_messages(*)')
      .eq('id', request.params.id)
      .eq('tenant_id', request.tenantId)
      .eq('user_id', request.userId)
      .single();

    if (error || !data) {
      reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Conversation not found' },
      });
      return;
    }
    return { success: true, data };
  });

  // Create conversation
  fastify.post<{ Body: { title?: string; module_context?: string; metadata?: Record<string, unknown> } }>(
    '/',
    async (request) => {
      const { data, error } = await fastify.supabase
        .from('ai_conversations')
        .insert({
          tenant_id: request.tenantId,
          user_id: request.userId,
          title: request.body.title ?? null,
          module_context: request.body.module_context ?? null,
          metadata: request.body.metadata ?? {},
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    }
  );

  // Update conversation
  fastify.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/:id',
    async (request, reply) => {
      const { data, error } = await fastify.supabase
        .from('ai_conversations')
        .update(request.body)
        .eq('id', request.params.id)
        .eq('tenant_id', request.tenantId)
        .eq('user_id', request.userId)
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        reply.status(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Conversation not found' },
        });
        return;
      }
      return { success: true, data };
    }
  );

  // Delete conversation
  fastify.delete<{ Params: { id: string } }>('/:id', async (request) => {
    const { error } = await fastify.supabase
      .from('ai_conversations')
      .delete()
      .eq('id', request.params.id)
      .eq('tenant_id', request.tenantId)
      .eq('user_id', request.userId);

    if (error) throw error;
    return { success: true };
  });
}
