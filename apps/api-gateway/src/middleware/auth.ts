import type { FastifyRequest, FastifyReply } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
    tenantId?: string;
    userType?: string;
  }
}

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    reply.status(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' },
    });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const { data, error } = await request.server.supabase.auth.getUser(token);

    if (error || !data.user) {
      reply.status(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' },
      });
      return;
    }

    // Fetch profile for tenant and user type info
    const { data: profile } = await request.server.supabase
      .from('profiles')
      .select('tenant_id, user_type')
      .eq('id', data.user.id)
      .single();

    if (!profile) {
      reply.status(403).send({
        success: false,
        error: { code: 'FORBIDDEN', message: 'User profile not found' },
      });
      return;
    }

    request.userId = data.user.id;
    request.tenantId = profile.tenant_id;
    request.userType = profile.user_type;
  } catch {
    reply.status(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Token verification failed' },
    });
  }
}
