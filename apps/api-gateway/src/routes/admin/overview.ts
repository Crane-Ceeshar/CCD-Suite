import type { FastifyInstance } from 'fastify';

export async function adminOverviewRoutes(fastify: FastifyInstance) {
  // Dashboard stats
  fastify.get('/', async (request) => {
    // User counts
    const { count: totalUsers } = await fastify.supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', request.tenantId);

    const { count: activeUsers } = await fastify.supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', request.tenantId)
      .eq('is_active', true);

    // Tenant info for enabled modules
    const { data: tenant } = await fastify.supabase
      .from('tenants')
      .select('settings, plan')
      .eq('id', request.tenantId)
      .single();

    const modulesEnabled = Array.isArray(tenant?.settings?.modules_enabled)
      ? tenant.settings.modules_enabled.length
      : 0;

    // Recent activity count (last 24h)
    const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
    const { count: recentActivity } = await fastify.supabase
      .from('activity_logs')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', request.tenantId)
      .gte('created_at', oneDayAgo);

    return {
      success: true,
      data: {
        total_users: totalUsers ?? 0,
        active_users: activeUsers ?? 0,
        total_modules_enabled: modulesEnabled,
        recent_activity_count: recentActivity ?? 0,
        plan: tenant?.plan ?? 'starter',
      },
    };
  });
}
