import type { FastifyInstance } from 'fastify';

export async function pipelinesRoutes(fastify: FastifyInstance) {
  // List pipelines
  fastify.get('/', async (request) => {
    const { data, error } = await fastify.supabase
      .from('pipelines')
      .select('*, stages:pipeline_stages(*)')
      .eq('tenant_id', request.tenantId)
      .order('created_at');

    if (error) throw error;

    // Sort stages by position
    data?.forEach((pipeline: any) => {
      if (pipeline.stages) {
        pipeline.stages.sort((a: any, b: any) => a.position - b.position);
      }
    });

    return { success: true, data };
  });

  // Create pipeline
  fastify.post<{ Body: { name: string; stages?: Array<{ name: string; color?: string; probability?: number }> } }>(
    '/',
    async (request) => {
      const { name, stages } = request.body;

      // Create pipeline
      const { data: pipeline, error: pipelineError } = await fastify.supabase
        .from('pipelines')
        .insert({ name, tenant_id: request.tenantId })
        .select()
        .single();

      if (pipelineError) throw pipelineError;

      // Create default stages if provided
      if (stages && stages.length > 0) {
        const stageRows = stages.map((s, i) => ({
          pipeline_id: pipeline.id,
          name: s.name,
          position: i,
          color: s.color,
          probability: s.probability ?? 0,
        }));

        await fastify.supabase.from('pipeline_stages').insert(stageRows);
      }

      // Return pipeline with stages
      const { data, error } = await fastify.supabase
        .from('pipelines')
        .select('*, stages:pipeline_stages(*)')
        .eq('id', pipeline.id)
        .single();

      if (error) throw error;
      return { success: true, data };
    }
  );
}
