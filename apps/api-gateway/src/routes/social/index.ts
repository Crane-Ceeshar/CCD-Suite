import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth.js';
import { requireModule } from '../../middleware/require-module.js';
import { accountsRoutes } from './accounts.js';
import { postsRoutes } from './posts.js';
import { campaignsRoutes } from './campaigns.js';
import { engagementRoutes } from './engagement.js';
import { commentsRoutes } from './comments.js';

export async function socialRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireAuth);
  fastify.addHook('preHandler', requireModule('social'));

  await fastify.register(accountsRoutes, { prefix: '/accounts' });
  await fastify.register(postsRoutes, { prefix: '/posts' });
  await fastify.register(campaignsRoutes, { prefix: '/campaigns' });
  await fastify.register(engagementRoutes, { prefix: '/engagement' });
  await fastify.register(commentsRoutes, { prefix: '/comments' });
}
