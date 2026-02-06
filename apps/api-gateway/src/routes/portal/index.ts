import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth.js';
import { requireModule } from '../../middleware/require-module.js';
import { portalProjectsRoutes } from './projects.js';
import { milestonesRoutes } from './milestones.js';
import { deliverablesRoutes } from './deliverables.js';
import { messagesRoutes } from './messages.js';
import { accessRoutes } from './access.js';

export async function portalRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireAuth);
  fastify.addHook('preHandler', requireModule('client_portal'));

  await fastify.register(portalProjectsRoutes, { prefix: '/projects' });
  await fastify.register(milestonesRoutes, { prefix: '/milestones' });
  await fastify.register(deliverablesRoutes, { prefix: '/deliverables' });
  await fastify.register(messagesRoutes, { prefix: '/messages' });
  await fastify.register(accessRoutes, { prefix: '/access' });
}
