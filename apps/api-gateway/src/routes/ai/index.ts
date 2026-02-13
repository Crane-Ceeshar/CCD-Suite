import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth.js';
import { requireModule } from '../../middleware/require-module.js';
import { conversationsRoutes } from './conversations.js';
import { proxyRoutes } from './proxy.js';
import { embedRoutes } from './embed.js';
import { automationRoutes } from './automation.js';

export async function aiRoutes(fastify: FastifyInstance) {
  // All AI routes require auth + AI module access
  fastify.addHook('preHandler', requireAuth);
  fastify.addHook('preHandler', requireModule('ai'));

  await fastify.register(conversationsRoutes, { prefix: '/conversations' });
  await fastify.register(proxyRoutes);
  await fastify.register(embedRoutes);
  await fastify.register(automationRoutes);
}
