import type { FastifyInstance } from 'fastify';

export async function deliverablesRoutes(fastify: FastifyInstance) {
  // Review deliverable (approve or request revision)
  fastify.patch<{ Params: { id: string }; Body: { status: string; feedback?: string } }>(
    '/:id/review',
    async (request, reply) => {
      const { status, feedback } = request.body;
      if (!['approved', 'revision_requested'].includes(status)) {
        reply.status(400).send({ success: false, error: { code: 'INVALID_STATUS', message: 'Status must be approved or revision_requested' } });
        return;
      }

      const { data, error } = await fastify.supabase
        .from('portal_deliverables')
        .update({
          status,
          feedback: feedback || null,
          reviewed_by: request.userId,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', request.params.id)
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Deliverable not found' } });
        return;
      }
      return { success: true, data };
    }
  );
}
