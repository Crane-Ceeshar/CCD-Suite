import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth.js';
import { requireModule } from '../../middleware/require-module.js';
import { companiesRoutes } from './companies.js';
import { contactsRoutes } from './contacts.js';
import { dealsRoutes } from './deals.js';
import { pipelinesRoutes } from './pipelines.js';
import { activitiesRoutes } from './activities.js';

export async function crmRoutes(fastify: FastifyInstance) {
  // All CRM routes require auth + CRM module access
  fastify.addHook('preHandler', requireAuth);
  fastify.addHook('preHandler', requireModule('crm'));

  await fastify.register(companiesRoutes, { prefix: '/companies' });
  await fastify.register(contactsRoutes, { prefix: '/contacts' });
  await fastify.register(dealsRoutes, { prefix: '/deals' });
  await fastify.register(pipelinesRoutes, { prefix: '/pipelines' });
  await fastify.register(activitiesRoutes, { prefix: '/activities' });
}
