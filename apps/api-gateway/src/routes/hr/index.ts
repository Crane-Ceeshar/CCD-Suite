import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth.js';
import { requireModule } from '../../middleware/require-module.js';
import { employeesRoutes } from './employees.js';
import { departmentsRoutes } from './departments.js';
import { leaveRoutes } from './leave.js';
import { attendanceRoutes } from './attendance.js';
import { payrollRoutes } from './payroll.js';

export async function hrRoutes(fastify: FastifyInstance) {
  // All HR routes require auth + hr module access
  fastify.addHook('preHandler', requireAuth);
  fastify.addHook('preHandler', requireModule('hr'));

  await fastify.register(employeesRoutes, { prefix: '/employees' });
  await fastify.register(departmentsRoutes, { prefix: '/departments' });
  await fastify.register(leaveRoutes, { prefix: '/leave' });
  await fastify.register(attendanceRoutes, { prefix: '/attendance' });
  await fastify.register(payrollRoutes, { prefix: '/payroll' });
}
