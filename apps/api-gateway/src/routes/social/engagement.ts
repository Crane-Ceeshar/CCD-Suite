import type { FastifyInstance } from 'fastify';

export async function engagementRoutes(fastify: FastifyInstance) {
  // Get aggregated engagement overview
  fastify.get('/overview', async (request) => {
    const { data, error } = await fastify.supabase
      .from('social_engagement')
      .select('*')
      .eq('tenant_id', request.tenantId)
      .order('recorded_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    // Aggregate totals
    const totals = (data || []).reduce(
      (acc: any, e: any) => ({
        likes: acc.likes + e.likes,
        comments: acc.comments + e.comments,
        shares: acc.shares + e.shares,
        impressions: acc.impressions + e.impressions,
        reach: acc.reach + e.reach,
        clicks: acc.clicks + e.clicks,
      }),
      { likes: 0, comments: 0, shares: 0, impressions: 0, reach: 0, clicks: 0 }
    );

    return { success: true, data: { totals, recent: data } };
  });
}
