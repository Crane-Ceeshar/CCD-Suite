import type { FastifyInstance } from 'fastify';

interface ServiceEndpoint {
  service: string;
  url: string;
  healthPath: string;
}

const SERVICE_ENDPOINTS: ServiceEndpoint[] = [
  {
    service: 'ai-services',
    url: process.env.AI_SERVICES_URL || 'http://localhost:5100',
    healthPath: '/health',
  },
  {
    service: 'analytics-engine',
    url: process.env.ANALYTICS_ENGINE_URL || 'http://localhost:5001',
    healthPath: '/health',
  },
  {
    service: 'file-processor',
    url: process.env.FILE_PROCESSOR_URL || 'http://localhost:5002',
    healthPath: '/health',
  },
  {
    service: 'realtime-gateway',
    url: process.env.REALTIME_GATEWAY_URL || 'http://localhost:5003',
    healthPath: '/health',
  },
];

async function checkHealth(
  service: string,
  url: string,
  healthPath: string
): Promise<{
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  latency_ms: number | null;
  last_checked: string;
}> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${url}${healthPath}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const latency = Date.now() - start;

    return {
      service,
      status: res.ok ? (latency > 2000 ? 'degraded' : 'healthy') : 'down',
      latency_ms: latency,
      last_checked: new Date().toISOString(),
    };
  } catch {
    return {
      service,
      status: 'down',
      latency_ms: null,
      last_checked: new Date().toISOString(),
    };
  }
}

export async function adminServicesRoutes(fastify: FastifyInstance) {
  // Check all service health
  fastify.get('/health', async () => {
    const results = await Promise.all(
      SERVICE_ENDPOINTS.map((ep) => checkHealth(ep.service, ep.url, ep.healthPath))
    );

    // API gateway is always healthy if this request is served
    results.unshift({
      service: 'api-gateway',
      status: 'healthy',
      latency_ms: 0,
      last_checked: new Date().toISOString(),
    });

    // Check Supabase with a simple query
    const sbStart = Date.now();
    try {
      await fastify.supabase.from('tenants').select('id').limit(1).single();
      results.push({
        service: 'supabase',
        status: 'healthy',
        latency_ms: Date.now() - sbStart,
        last_checked: new Date().toISOString(),
      });
    } catch {
      results.push({
        service: 'supabase',
        status: 'down',
        latency_ms: null,
        last_checked: new Date().toISOString(),
      });
    }

    return { success: true, data: results };
  });
}
