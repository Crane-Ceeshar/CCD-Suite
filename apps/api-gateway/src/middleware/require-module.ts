import type { FastifyRequest, FastifyReply } from 'fastify';

// Mirrors @ccd/shared USER_TYPE_MODULE_ACCESS
const USER_TYPE_MODULE_ACCESS: Record<string, string[]> = {
  admin: ['crm', 'analytics', 'content', 'seo', 'social', 'client_portal', 'projects', 'finance', 'hr'],
  sales: ['crm', 'analytics'],
  marketing: ['content', 'seo', 'social', 'analytics'],
  project_manager: ['projects', 'analytics'],
  finance: ['finance', 'analytics'],
  hr: ['hr', 'analytics'],
  client: ['client_portal'],
};

export function requireModule(moduleId: string) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    const userType = request.userType;

    if (!userType) {
      reply.status(403).send({
        success: false,
        error: { code: 'FORBIDDEN', message: 'User type not found' },
      });
      return;
    }

    const allowedModules = USER_TYPE_MODULE_ACCESS[userType] ?? [];

    if (!allowedModules.includes(moduleId)) {
      reply.status(403).send({
        success: false,
        error: {
          code: 'MODULE_ACCESS_DENIED',
          message: `Access to ${moduleId} module is not allowed for user type: ${userType}`,
        },
      });
      return;
    }
  };
}
