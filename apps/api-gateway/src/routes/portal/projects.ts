import type { FastifyInstance } from 'fastify';

export async function portalProjectsRoutes(fastify: FastifyInstance) {
  // List portal projects
  fastify.get('/', async (request) => {
    const { data, error } = await fastify.supabase
      .from('portal_projects')
      .select('*, milestones:portal_milestones(id, title, status)')
      .eq('tenant_id', request.tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  });

  // Get portal project by ID
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { data, error } = await fastify.supabase
      .from('portal_projects')
      .select('*, milestones:portal_milestones(*), deliverables:portal_deliverables(*)')
      .eq('id', request.params.id)
      .single();

    if (error || !data) {
      reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Portal project not found' } });
      return;
    }

    // Sort milestones by position
    if (data.milestones) {
      data.milestones.sort((a: any, b: any) => a.position - b.position);
    }

    return { success: true, data };
  });

  // Create portal project
  fastify.post<{ Body: Record<string, unknown> }>('/', async (request) => {
    const { data, error } = await fastify.supabase
      .from('portal_projects')
      .insert({ ...request.body, tenant_id: request.tenantId })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  });

  // Update portal project
  fastify.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/:id',
    async (request, reply) => {
      const { data, error } = await fastify.supabase
        .from('portal_projects')
        .update(request.body)
        .eq('id', request.params.id)
        .eq('tenant_id', request.tenantId)
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Portal project not found' } });
        return;
      }
      return { success: true, data };
    }
  );

  // Get milestones for project
  fastify.get<{ Params: { id: string } }>('/:id/milestones', async (request) => {
    const { data, error } = await fastify.supabase
      .from('portal_milestones')
      .select('*')
      .eq('portal_project_id', request.params.id)
      .order('position', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  });

  // Create milestone
  fastify.post<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/:id/milestones',
    async (request) => {
      const { data, error } = await fastify.supabase
        .from('portal_milestones')
        .insert({ ...request.body, portal_project_id: request.params.id })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    }
  );

  // Get deliverables for project
  fastify.get<{ Params: { id: string } }>('/:id/deliverables', async (request) => {
    const { data, error } = await fastify.supabase
      .from('portal_deliverables')
      .select('*')
      .eq('portal_project_id', request.params.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  });

  // Upload deliverable
  fastify.post<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/:id/deliverables',
    async (request) => {
      const { data, error } = await fastify.supabase
        .from('portal_deliverables')
        .insert({
          ...request.body,
          portal_project_id: request.params.id,
          tenant_id: request.tenantId,
          uploaded_by: request.userId,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    }
  );

  // Get messages for project
  fastify.get<{ Params: { id: string } }>('/:id/messages', async (request) => {
    const { data, error } = await fastify.supabase
      .from('portal_messages')
      .select('*')
      .eq('portal_project_id', request.params.id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  });

  // Send message
  fastify.post<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/:id/messages',
    async (request) => {
      const { data, error } = await fastify.supabase
        .from('portal_messages')
        .insert({
          ...request.body,
          portal_project_id: request.params.id,
          tenant_id: request.tenantId,
          sender_id: request.userId,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    }
  );
}
