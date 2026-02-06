import type { FastifyInstance } from 'fastify';

export async function adminSettingsRoutes(fastify: FastifyInstance) {
  // Get tenant settings
  fastify.get('/tenant', async (request) => {
    const { data, error } = await fastify.supabase
      .from('tenants')
      .select('*')
      .eq('id', request.tenantId)
      .single();

    if (error) throw error;
    return { success: true, data };
  });

  // Update tenant settings
  fastify.patch<{ Body: Record<string, unknown> }>('/tenant', async (request) => {
    const allowed = ['name', 'logo_url', 'settings'];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (request.body[key] !== undefined) {
        updates[key] = request.body[key];
      }
    }

    const { data, error } = await fastify.supabase
      .from('tenants')
      .update(updates)
      .eq('id', request.tenantId)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await fastify.supabase.from('activity_logs').insert({
      tenant_id: request.tenantId,
      user_id: request.userId,
      action: 'tenant.updated',
      resource_type: 'tenant',
      resource_id: request.tenantId,
      details: { updated_fields: Object.keys(updates) },
    });

    return { success: true, data };
  });

  // Get AI settings
  fastify.get('/ai', async (request) => {
    const { data, error } = await fastify.supabase
      .from('ai_settings')
      .select('*')
      .eq('tenant_id', request.tenantId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return { success: true, data: data ?? null };
  });

  // Update/create AI settings
  fastify.patch<{ Body: Record<string, unknown> }>('/ai', async (request) => {
    const allowed = [
      'preferred_model',
      'max_tokens_per_request',
      'monthly_token_budget',
      'features_enabled',
    ];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (request.body[key] !== undefined) {
        updates[key] = request.body[key];
      }
    }

    // Upsert AI settings
    const { data: existing } = await fastify.supabase
      .from('ai_settings')
      .select('id')
      .eq('tenant_id', request.tenantId)
      .single();

    let data;
    if (existing) {
      const result = await fastify.supabase
        .from('ai_settings')
        .update(updates)
        .eq('tenant_id', request.tenantId)
        .select()
        .single();
      if (result.error) throw result.error;
      data = result.data;
    } else {
      const result = await fastify.supabase
        .from('ai_settings')
        .insert({ ...updates, tenant_id: request.tenantId })
        .select()
        .single();
      if (result.error) throw result.error;
      data = result.data;
    }

    await fastify.supabase.from('activity_logs').insert({
      tenant_id: request.tenantId,
      user_id: request.userId,
      action: 'settings.updated',
      resource_type: 'ai_settings',
      details: { updated_fields: Object.keys(updates) },
    });

    return { success: true, data };
  });

  // Get system settings
  fastify.get('/system', async (request) => {
    const { data, error } = await fastify.supabase
      .from('system_settings')
      .select('*')
      .eq('tenant_id', request.tenantId)
      .order('key');

    if (error) throw error;
    return { success: true, data };
  });

  // Upsert a system setting
  fastify.patch<{ Params: { key: string }; Body: { value: unknown } }>(
    '/system/:key',
    async (request) => {
      const { data: existing } = await fastify.supabase
        .from('system_settings')
        .select('id')
        .eq('tenant_id', request.tenantId)
        .eq('key', request.params.key)
        .single();

      let data;
      if (existing) {
        const result = await fastify.supabase
          .from('system_settings')
          .update({ value: request.body.value, updated_by: request.userId })
          .eq('id', existing.id)
          .select()
          .single();
        if (result.error) throw result.error;
        data = result.data;
      } else {
        const result = await fastify.supabase
          .from('system_settings')
          .insert({
            tenant_id: request.tenantId,
            key: request.params.key,
            value: request.body.value,
            updated_by: request.userId,
          })
          .select()
          .single();
        if (result.error) throw result.error;
        data = result.data;
      }

      return { success: true, data };
    }
  );
}
