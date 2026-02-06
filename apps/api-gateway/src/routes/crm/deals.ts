import type { FastifyInstance } from 'fastify';

export async function dealsRoutes(fastify: FastifyInstance) {
  // List deals (flat)
  fastify.get('/', async (request) => {
    const { data, error } = await fastify.supabase
      .from('deals')
      .select('*, company:companies(id, name), contact:contacts(id, first_name, last_name), stage:pipeline_stages(id, name, color)')
      .eq('tenant_id', request.tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  });

  // Get pipeline board view (deals grouped by stage)
  fastify.get<{ Params: { pipelineId: string } }>(
    '/pipeline/:pipelineId',
    async (request, reply) => {
      // Get pipeline with stages
      const { data: pipeline, error: pipelineError } = await fastify.supabase
        .from('pipelines')
        .select('*, stages:pipeline_stages(*, deals(*, company:companies(id, name), contact:contacts(id, first_name, last_name)))')
        .eq('id', request.params.pipelineId)
        .eq('tenant_id', request.tenantId)
        .single();

      if (pipelineError || !pipeline) {
        reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Pipeline not found' } });
        return;
      }

      // Sort stages by position and deals within each stage by position
      if (pipeline.stages) {
        pipeline.stages.sort((a: any, b: any) => a.position - b.position);
        pipeline.stages.forEach((stage: any) => {
          if (stage.deals) {
            stage.deals.sort((a: any, b: any) => a.position - b.position);
          }
        });
      }

      return { success: true, data: pipeline };
    }
  );

  // Get deal by ID
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { data, error } = await fastify.supabase
      .from('deals')
      .select('*, company:companies(*), contact:contacts(*), stage:pipeline_stages(*)')
      .eq('id', request.params.id)
      .eq('tenant_id', request.tenantId)
      .single();

    if (error || !data) {
      reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Deal not found' } });
      return;
    }
    return { success: true, data };
  });

  // Create deal
  fastify.post<{ Body: Record<string, unknown> }>('/', async (request) => {
    const { data, error } = await fastify.supabase
      .from('deals')
      .insert({ ...request.body, tenant_id: request.tenantId, created_by: request.userId })
      .select('*, company:companies(id, name), contact:contacts(id, first_name, last_name), stage:pipeline_stages(id, name, color)')
      .single();

    if (error) throw error;
    return { success: true, data };
  });

  // Update deal (including stage change / drag-drop)
  fastify.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/:id',
    async (request, reply) => {
      const { data, error } = await fastify.supabase
        .from('deals')
        .update(request.body)
        .eq('id', request.params.id)
        .eq('tenant_id', request.tenantId)
        .select('*, company:companies(id, name), contact:contacts(id, first_name, last_name), stage:pipeline_stages(id, name, color)')
        .single();

      if (error) throw error;
      if (!data) {
        reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Deal not found' } });
        return;
      }
      return { success: true, data };
    }
  );

  // Delete deal
  fastify.delete<{ Params: { id: string } }>('/:id', async (request) => {
    const { error } = await fastify.supabase
      .from('deals')
      .delete()
      .eq('id', request.params.id)
      .eq('tenant_id', request.tenantId);

    if (error) throw error;
    return { success: true };
  });
}
