import type { FastifyInstance } from 'fastify';
import crypto from 'crypto';

export async function accessRoutes(fastify: FastifyInstance) {
  // Generate magic link invite
  fastify.post<{ Body: { client_email: string; portal_project_id: string } }>(
    '/invite',
    async (request) => {
      const { client_email, portal_project_id } = request.body;

      // Generate random token
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Store hashed token (expires in 7 days)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data, error } = await fastify.supabase
        .from('portal_access_tokens')
        .insert({
          tenant_id: request.tenantId,
          client_email,
          token_hash: tokenHash,
          portal_project_id,
          expires_at: expiresAt.toISOString(),
          created_by: request.userId,
        })
        .select()
        .single();

      if (error) throw error;

      // Return the raw token (to be sent in email link)
      return {
        success: true,
        data: {
          ...data,
          token, // raw token for the invite link
        },
      };
    }
  );

  // Verify magic link token
  fastify.post<{ Body: { token: string } }>(
    '/verify',
    async (request, reply) => {
      const { token } = request.body;
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      const { data, error } = await fastify.supabase
        .from('portal_access_tokens')
        .select('*')
        .eq('token_hash', tokenHash)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        reply.status(401).send({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } });
        return;
      }

      // Mark as used
      await fastify.supabase
        .from('portal_access_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('id', data.id);

      return {
        success: true,
        data: {
          client_email: data.client_email,
          portal_project_id: data.portal_project_id,
          tenant_id: data.tenant_id,
        },
      };
    }
  );
}
