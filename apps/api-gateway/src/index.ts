import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { supabasePlugin } from './plugins/supabase.js';
import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/users.js';
import { tenantRoutes } from './routes/tenants.js';
import { healthRoutes } from './routes/health.js';
import { crmRoutes } from './routes/crm/index.js';
import { contentRoutes } from './routes/content/index.js';
import { projectsRoutes } from './routes/projects/index.js';
import { analyticsRoutes } from './routes/analytics/index.js';
import { notificationRoutes } from './routes/notifications.js';
import { uploadRoutes } from './routes/uploads.js';
import { financeRoutes } from './routes/finance/index.js';
import { hrRoutes } from './routes/hr/index.js';
import { seoRoutes } from './routes/seo/index.js';
import { socialRoutes } from './routes/social/index.js';
import { portalRoutes } from './routes/portal/index.js';
import { aiRoutes } from './routes/ai/index.js';
import { adminRoutes } from './routes/admin/index.js';

const PORT = parseInt(process.env.PORT || process.env.API_PORT || '4000', 10);
const HOST = process.env.API_HOST || '0.0.0.0';

async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport:
        process.env.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  });

  // CORS
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  // Rate limiting
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Supabase plugin
  await app.register(supabasePlugin);

  // Routes
  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(userRoutes, { prefix: '/api/users' });
  await app.register(tenantRoutes, { prefix: '/api/tenants' });
  await app.register(crmRoutes, { prefix: '/api/crm' });
  await app.register(contentRoutes, { prefix: '/api/content' });
  await app.register(projectsRoutes, { prefix: '/api/projects' });
  await app.register(analyticsRoutes, { prefix: '/api/analytics' });
  await app.register(notificationRoutes, { prefix: '/api/notifications' });
  await app.register(uploadRoutes, { prefix: '/api/uploads' });
  await app.register(financeRoutes, { prefix: '/api/finance' });
  await app.register(hrRoutes, { prefix: '/api/hr' });
  await app.register(seoRoutes, { prefix: '/api/seo' });
  await app.register(socialRoutes, { prefix: '/api/social' });
  await app.register(portalRoutes, { prefix: '/api/portal' });
  await app.register(aiRoutes, { prefix: '/api/ai' });
  await app.register(adminRoutes, { prefix: '/api/admin' });

  // Global error handler
  app.setErrorHandler((error, request, reply) => {
    app.log.error(error);

    const statusCode = error.statusCode ?? 500;
    reply.status(statusCode).send({
      success: false,
      error: {
        code: error.code ?? 'INTERNAL_ERROR',
        message:
          statusCode === 500 ? 'Internal server error' : error.message,
      },
    });
  });

  return app;
}

async function start() {
  const app = await buildApp();

  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`API gateway running on http://${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
