import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';

export async function notificationRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireAuth);

  // List notifications for current user
  fastify.get('/', async (request) => {
    const { data, error } = await fastify.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', request.userId)
      .eq('tenant_id', request.tenantId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return { success: true, data };
  });

  // Get unread count
  fastify.get('/unread-count', async (request) => {
    const { count, error } = await fastify.supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', request.userId)
      .eq('is_read', false);

    if (error) throw error;
    return { success: true, data: { count: count ?? 0 } };
  });

  // Mark notification as read
  fastify.patch<{ Params: { id: string } }>('/:id/read', async (request) => {
    const { data, error } = await fastify.supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', request.params.id)
      .eq('user_id', request.userId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  });

  // Mark all as read
  fastify.patch('/read-all', async (request) => {
    const { error } = await fastify.supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', request.userId)
      .eq('is_read', false);

    if (error) throw error;
    return { success: true };
  });

  // Create notification (for internal use / admin)
  fastify.post<{ Body: { user_id: string; type: string; title: string; message?: string; link?: string; module?: string } }>(
    '/',
    async (request, reply) => {
      if (request.userType !== 'admin') {
        reply.status(403).send({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } });
        return;
      }

      const { data, error } = await fastify.supabase
        .from('notifications')
        .insert({ ...request.body, tenant_id: request.tenantId })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    }
  );
}
