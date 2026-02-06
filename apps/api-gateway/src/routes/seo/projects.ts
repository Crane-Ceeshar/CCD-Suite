import type { FastifyInstance } from 'fastify';

export async function projectsRoutes(fastify: FastifyInstance) {
  // List SEO projects
  fastify.get('/', async (request) => {
    const { data, error } = await fastify.supabase
      .from('seo_projects')
      .select('*')
      .eq('tenant_id', request.tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  });

  // Get SEO project by ID
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { data, error } = await fastify.supabase
      .from('seo_projects')
      .select('*')
      .eq('id', request.params.id)
      .eq('tenant_id', request.tenantId)
      .single();

    if (error || !data) {
      reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'SEO project not found' } });
      return;
    }
    return { success: true, data };
  });

  // Create SEO project
  fastify.post<{ Body: Record<string, unknown> }>('/', async (request) => {
    const { data, error } = await fastify.supabase
      .from('seo_projects')
      .insert({ ...request.body, tenant_id: request.tenantId, created_by: request.userId })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  });

  // Update SEO project
  fastify.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/:id',
    async (request, reply) => {
      const { data, error } = await fastify.supabase
        .from('seo_projects')
        .update(request.body)
        .eq('id', request.params.id)
        .eq('tenant_id', request.tenantId)
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'SEO project not found' } });
        return;
      }
      return { success: true, data };
    }
  );

  // Delete SEO project
  fastify.delete<{ Params: { id: string } }>('/:id', async (request) => {
    const { error } = await fastify.supabase
      .from('seo_projects')
      .delete()
      .eq('id', request.params.id)
      .eq('tenant_id', request.tenantId);

    if (error) throw error;
    return { success: true };
  });

  // List audits for project
  fastify.get<{ Params: { id: string } }>('/:id/audits', async (request) => {
    const { data, error } = await fastify.supabase
      .from('seo_audits')
      .select('*')
      .eq('project_id', request.params.id)
      .eq('tenant_id', request.tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  });

  // Run new audit for project
  fastify.post<{ Params: { id: string } }>('/:id/audits', async (request) => {
    const { data, error } = await fastify.supabase
      .from('seo_audits')
      .insert({
        project_id: request.params.id,
        tenant_id: request.tenantId,
        status: 'running',
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  });

  // List keywords for project
  fastify.get<{ Params: { id: string } }>('/:id/keywords', async (request) => {
    const { data, error } = await fastify.supabase
      .from('seo_keywords')
      .select('*')
      .eq('project_id', request.params.id)
      .eq('tenant_id', request.tenantId)
      .order('keyword', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  });

  // Add keyword to project
  fastify.post<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/:id/keywords',
    async (request) => {
      const { data, error } = await fastify.supabase
        .from('seo_keywords')
        .insert({
          ...request.body,
          project_id: request.params.id,
          tenant_id: request.tenantId,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    }
  );

  // List backlinks for project
  fastify.get<{ Params: { id: string } }>('/:id/backlinks', async (request) => {
    const { data, error } = await fastify.supabase
      .from('seo_backlinks')
      .select('*')
      .eq('project_id', request.params.id)
      .eq('tenant_id', request.tenantId)
      .order('discovered_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  });

  // Add backlink
  fastify.post<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/:id/backlinks',
    async (request) => {
      const { data, error } = await fastify.supabase
        .from('seo_backlinks')
        .insert({
          ...request.body,
          project_id: request.params.id,
          tenant_id: request.tenantId,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    }
  );

  // List recommendations for project
  fastify.get<{ Params: { id: string } }>('/:id/recommendations', async (request) => {
    const { data, error } = await fastify.supabase
      .from('seo_recommendations')
      .select('*')
      .eq('project_id', request.params.id)
      .eq('tenant_id', request.tenantId)
      .order('priority', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  });
}
