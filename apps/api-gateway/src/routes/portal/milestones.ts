import type { FastifyInstance } from 'fastify';

export async function milestonesRoutes(fastify: FastifyInstance) {
  // Update milestone status
  fastify.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/:id',
    async (request, reply) => {
      const body = request.body as any;
      const updateData: any = { ...body };

      if (body.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await fastify.supabase
        .from('portal_milestones')
        .update(updateData)
        .eq('id', request.params.id)
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Milestone not found' } });
        return;
      }
      return { success: true, data };
    }
  );
}
