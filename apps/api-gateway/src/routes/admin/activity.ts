import type { FastifyInstance } from 'fastify';

export async function adminActivityRoutes(fastify: FastifyInstance) {
  // List activity logs with pagination
  fastify.get<{
    Querystring: { page?: string; per_page?: string; action?: string; user_id?: string };
  }>('/', async (request) => {
    const page = parseInt(request.query.page || '1', 10);
    const perPage = Math.min(parseInt(request.query.per_page || '25', 10), 100);
    const offset = (page - 1) * perPage;

    let query = fastify.supabase
      .from('activity_logs')
      .select('*, profiles!activity_logs_user_id_fkey(full_name, email, avatar_url)', {
        count: 'exact',
      })
      .eq('tenant_id', request.tenantId)
      .order('created_at', { ascending: false })
      .range(offset, offset + perPage - 1);

    if (request.query.action) {
      query = query.eq('action', request.query.action);
    }
    if (request.query.user_id) {
      query = query.eq('user_id', request.query.user_id);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      success: true,
      data,
      pagination: {
        page,
        per_page: perPage,
        total: count ?? 0,
        total_pages: Math.ceil((count ?? 0) / perPage),
      },
    };
  });
}
