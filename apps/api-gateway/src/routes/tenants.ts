import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';

export async function tenantRoutes(fastify: FastifyInstance) {
  // Get current tenant
  fastify.get(
    '/current',
    { preHandler: [requireAuth] },
    async (request) => {
      const { data, error } = await fastify.supabase
        .from('tenants')
        .select('*')
        .eq('id', request.tenantId)
        .single();

      if (error) throw error;

      return { success: true, data };
    }
  );

  // Update tenant (admin only)
  fastify.patch<{
    Body: { name?: string; logo_url?: string; settings?: Record<string, unknown> };
  }>(
    '/current',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      if (request.userType !== 'admin') {
        reply.status(403).send({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Admin access required' },
        });
        return;
      }

      const { data, error } = await fastify.supabase
        .from('tenants')
        .update(request.body)
        .eq('id', request.tenantId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    }
  );
}
