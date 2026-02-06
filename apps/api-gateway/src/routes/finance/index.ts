import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth.js';
import { requireModule } from '../../middleware/require-module.js';
import { invoicesRoutes } from './invoices.js';
import { expensesRoutes } from './expenses.js';
import { paymentsRoutes } from './payments.js';

export async function financeRoutes(fastify: FastifyInstance) {
  // All Finance routes require auth + finance module access
  fastify.addHook('preHandler', requireAuth);
  fastify.addHook('preHandler', requireModule('finance'));

  await fastify.register(invoicesRoutes, { prefix: '/invoices' });
  await fastify.register(expensesRoutes, { prefix: '/expenses' });
  await fastify.register(paymentsRoutes, { prefix: '/payments' });
}
