import type { FastifyInstance } from 'fastify';

export async function commentsRoutes(fastify: FastifyInstance) {
  // List comments
  fastify.get('/', async (request) => {
    const { platform, sentiment, replied } = request.query as {
      platform?: string;
      sentiment?: string;
      replied?: string;
    };

    let query = fastify.supabase
      .from('social_comments')
      .select('*')
      .eq('tenant_id', request.tenantId)
      .order('created_at', { ascending: false });

    if (platform) query = query.eq('platform', platform);
    if (sentiment) query = query.eq('sentiment', sentiment);
    if (replied === 'true') query = query.eq('replied', true);
    if (replied === 'false') query = query.eq('replied', false);

    const { data, error } = await query;
    if (error) throw error;
    return { success: true, data };
  });

  // Reply to comment
  fastify.patch<{ Params: { id: string }; Body: { reply_content: string } }>(
    '/:id/reply',
    async (request, reply) => {
      const { data, error } = await fastify.supabase
        .from('social_comments')
        .update({ replied: true, reply_content: request.body.reply_content })
        .eq('id', request.params.id)
        .eq('tenant_id', request.tenantId)
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Comment not found' } });
        return;
      }
      return { success: true, data };
    }
  );
}
