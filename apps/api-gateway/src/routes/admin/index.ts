import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth.js';
import { requireModule } from '../../middleware/require-module.js';
import { adminOverviewRoutes } from './overview.js';
import { adminUsersRoutes } from './users.js';
import { adminServicesRoutes } from './services.js';
import { adminSettingsRoutes } from './settings.js';
import { adminActivityRoutes } from './activity.js';
import { adminApiKeysRoutes } from './api-keys.js';

export async function adminRoutes(fastify: FastifyInstance) {
  // All admin routes require auth + admin module access
  fastify.addHook('preHandler', requireAuth);
  fastify.addHook('preHandler', requireModule('admin'));

  await fastify.register(adminOverviewRoutes, { prefix: '/overview' });
  await fastify.register(adminUsersRoutes, { prefix: '/users' });
  await fastify.register(adminServicesRoutes, { prefix: '/services' });
  await fastify.register(adminSettingsRoutes, { prefix: '/settings' });
  await fastify.register(adminActivityRoutes, { prefix: '/activity' });
  await fastify.register(adminApiKeysRoutes, { prefix: '/api-keys' });
}
