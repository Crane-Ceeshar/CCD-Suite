import type { FastifyInstance } from 'fastify';
import { randomBytes, createHash } from 'crypto';

function generateApiKey(): string {
  return 'ccd_' + randomBytes(32).toString('hex');
}

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export async function adminApiKeysRoutes(fastify: FastifyInstance) {
  // List API keys (masked)
  fastify.get('/', async (request) => {
    const { data, error } = await fastify.supabase
      .from('api_keys')
      .select('id, name, key_prefix, scopes, is_active, last_used_at, expires_at, created_by, created_at')
      .eq('tenant_id', request.tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  });

  // Create API key
  fastify.post<{ Body: { name: string; scopes?: string[]; expires_at?: string } }>(
    '/',
    async (request, reply) => {
      const { name, scopes, expires_at } = request.body;

      if (!name) {
        reply.status(400).send({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'name is required' },
        });
        return;
      }

      const rawKey = generateApiKey();
      const keyHash = hashKey(rawKey);
      const keyPrefix = rawKey.substring(0, 12);

      const { data, error } = await fastify.supabase
        .from('api_keys')
        .insert({
          tenant_id: request.tenantId,
          name,
          key_prefix: keyPrefix,
          key_hash: keyHash,
          scopes: scopes ?? [],
          expires_at: expires_at ?? null,
          created_by: request.userId,
        })
        .select('id, name, key_prefix, scopes, is_active, expires_at, created_at')
        .single();

      if (error) throw error;

      // Log activity
      await fastify.supabase.from('activity_logs').insert({
        tenant_id: request.tenantId,
        user_id: request.userId,
        action: 'api_key.created',
        resource_type: 'api_key',
        resource_id: data.id,
        details: { name },
      });

      // Return full key ONCE — never stored or returned again
      return { success: true, data: { ...data, key: rawKey } };
    }
  );

  // Rotate API key
  fastify.patch<{ Params: { id: string } }>('/:id/rotate', async (request, reply) => {
    // Verify key belongs to tenant
    const { data: existing } = await fastify.supabase
      .from('api_keys')
      .select('id')
      .eq('id', request.params.id)
      .eq('tenant_id', request.tenantId)
      .single();

    if (!existing) {
      reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'API key not found' },
      });
      return;
    }

    const rawKey = generateApiKey();
    const keyHash = hashKey(rawKey);
    const keyPrefix = rawKey.substring(0, 12);

    const { data, error } = await fastify.supabase
      .from('api_keys')
      .update({ key_hash: keyHash, key_prefix: keyPrefix })
      .eq('id', request.params.id)
      .select('id, name, key_prefix, scopes, is_active, expires_at, created_at')
      .single();

    if (error) throw error;

    await fastify.supabase.from('activity_logs').insert({
      tenant_id: request.tenantId,
      user_id: request.userId,
      action: 'api_key.rotated',
      resource_type: 'api_key',
      resource_id: request.params.id,
      details: {},
    });

    return { success: true, data: { ...data, key: rawKey } };
  });

  // Deactivate API key
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { data, error } = await fastify.supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', request.params.id)
      .eq('tenant_id', request.tenantId)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'API key not found' },
      });
      return;
    }

    await fastify.supabase.from('activity_logs').insert({
      tenant_id: request.tenantId,
      user_id: request.userId,
      action: 'api_key.deleted',
      resource_type: 'api_key',
      resource_id: request.params.id,
      details: {},
    });

    return { success: true };
  });
}
