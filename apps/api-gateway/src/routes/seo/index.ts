import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth.js';
import { requireModule } from '../../middleware/require-module.js';
import { projectsRoutes } from './projects.js';
import { keywordsRoutes } from './keywords.js';
import { auditsRoutes } from './audits.js';
import { backlinksRoutes } from './backlinks.js';
import { recommendationsRoutes } from './recommendations.js';

export async function seoRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireAuth);
  fastify.addHook('preHandler', requireModule('seo'));

  await fastify.register(projectsRoutes, { prefix: '/projects' });
  await fastify.register(keywordsRoutes, { prefix: '/keywords' });
  await fastify.register(auditsRoutes, { prefix: '/audits' });
  await fastify.register(backlinksRoutes, { prefix: '/backlinks' });
  await fastify.register(recommendationsRoutes, { prefix: '/recommendations' });
}
