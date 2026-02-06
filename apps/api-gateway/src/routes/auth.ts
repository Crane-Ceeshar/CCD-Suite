import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';

export async function authRoutes(fastify: FastifyInstance) {
  // Get current session info
  fastify.get(
    '/me',
    { preHandler: [requireAuth] },
    async (request) => {
      const { data: profile } = await fastify.supabase
        .from('profiles')
        .select('*, tenants(*)')
        .eq('id', request.userId)
        .single();

      return {
        success: true,
        data: profile,
      };
    }
  );
}
