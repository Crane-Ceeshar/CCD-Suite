import type { FastifyInstance } from 'fastify';

export async function adminUsersRoutes(fastify: FastifyInstance) {
  // List all users in tenant
  fastify.get('/', async (request) => {
    const { data, error } = await fastify.supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url, user_type, is_active, created_at, updated_at')
      .eq('tenant_id', request.tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  });

  // Get user by ID
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { data, error } = await fastify.supabase
      .from('profiles')
      .select('*')
      .eq('id', request.params.id)
      .eq('tenant_id', request.tenantId)
      .single();

    if (error || !data) {
      reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
      return;
    }
    return { success: true, data };
  });

  // Update user (role, name, active status)
  fastify.patch<{
    Params: { id: string };
    Body: { full_name?: string; user_type?: string; is_active?: boolean };
  }>('/:id', async (request, reply) => {
    const updates: Record<string, unknown> = {};
    if (request.body.full_name !== undefined) updates.full_name = request.body.full_name;
    if (request.body.user_type !== undefined) updates.user_type = request.body.user_type;
    if (request.body.is_active !== undefined) updates.is_active = request.body.is_active;

    if (Object.keys(updates).length === 0) {
      reply.status(400).send({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'No fields to update' },
      });
      return;
    }

    const { data, error } = await fastify.supabase
      .from('profiles')
      .update(updates)
      .eq('id', request.params.id)
      .eq('tenant_id', request.tenantId)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
      return;
    }

    // Log activity
    await fastify.supabase.from('activity_logs').insert({
      tenant_id: request.tenantId,
      user_id: request.userId,
      action: request.body.is_active === false ? 'user.deactivated' : 'user.updated',
      resource_type: 'profile',
      resource_id: request.params.id,
      details: updates,
    });

    return { success: true, data };
  });

  // Invite new user
  fastify.post<{
    Body: { email: string; full_name: string; user_type: string };
  }>('/invite', async (request, reply) => {
    const { email, full_name, user_type } = request.body;

    if (!email || !full_name || !user_type) {
      reply.status(400).send({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'email, full_name, and user_type are required' },
      });
      return;
    }

    // Create user via Supabase admin API
    const { data: authUser, error: authError } = await fastify.supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name,
        tenant_id: request.tenantId,
        user_type,
      },
    });

    if (authError) {
      reply.status(400).send({
        success: false,
        error: { code: 'USER_CREATE_FAILED', message: authError.message },
      });
      return;
    }

    // The trigger on auth.users auto-creates the profile, but update it with correct fields
    if (authUser.user) {
      await fastify.supabase
        .from('profiles')
        .update({
          full_name,
          user_type,
          tenant_id: request.tenantId,
        })
        .eq('id', authUser.user.id);
    }

    // Log activity
    await fastify.supabase.from('activity_logs').insert({
      tenant_id: request.tenantId,
      user_id: request.userId,
      action: 'user.created',
      resource_type: 'profile',
      resource_id: authUser.user?.id ?? null,
      details: { email, full_name, user_type },
    });

    return { success: true, data: { id: authUser.user?.id, email, full_name, user_type } };
  });
}
