import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';

export async function userRoutes(fastify: FastifyInstance) {
  // List users in tenant
  fastify.get(
    '/',
    { preHandler: [requireAuth] },
    async (request) => {
      const { data, error } = await fastify.supabase
        .from('profiles')
        .select('*')
        .eq('tenant_id', request.tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, data };
    }
  );

  // Get user by ID
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    { preHandler: [requireAuth] },
    async (request, reply) => {
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
    }
  );

  // Update user profile
  fastify.patch<{
    Params: { id: string };
    Body: { full_name?: string; avatar_url?: string; user_type?: string };
  }>(
    '/:id',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      // Only admins can update other users' profiles
      if (request.params.id !== request.userId && request.userType !== 'admin') {
        reply.status(403).send({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Cannot update other users' },
        });
        return;
      }

      const { data, error } = await fastify.supabase
        .from('profiles')
        .update(request.body)
        .eq('id', request.params.id)
        .eq('tenant_id', request.tenantId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    }
  );
}
