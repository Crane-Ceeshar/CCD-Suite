import { NextResponse } from 'next/server';
import { requireAdmin, createAdminServiceClient } from '@/lib/supabase/admin';

interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  latency_ms: number | null;
  last_checked: string;
  detail?: string;
}

async function checkService(
  name: string,
  baseUrl: string | undefined
): Promise<ServiceHealth> {
  const now = new Date().toISOString();

  if (!baseUrl) {
    return { service: name, status: 'unknown', latency_ms: null, last_checked: now, detail: 'No URL configured' };
  }

  // Ensure URL has protocol
  let base = baseUrl.replace(/\/$/, '');
  if (!base.startsWith('http://') && !base.startsWith('https://')) {
    base = `https://${base}`;
  }

  const errors: string[] = [];

  // Try multiple health endpoints:
  // - /health (standard for most services)
  // - /api/health (api-gateway uses Fastify with /api prefix)
  // - / (final fallback — any response means the service is alive)
  for (const path of ['/health', '/api/health', '/']) {
    try {
      const start = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${base}${path}`, {
        signal: controller.signal,
        redirect: 'follow',
        cache: 'no-store',
      });
      clearTimeout(timeout);

      const latency = Date.now() - start;

      // 200 OK from a health endpoint — fully healthy
      if (res.ok) {
        return {
          service: name,
          status: latency > 2000 ? 'degraded' : 'healthy',
          latency_ms: latency,
          last_checked: now,
          detail: `OK via ${path}`,
        };
      }

      // Non-OK but got an HTTP response — service IS reachable
      // For /health and /api/health, try next path for a proper 200
      if (path !== '/') {
        errors.push(`${path} → ${res.status}`);
        continue;
      }

      // Even root returned non-OK, but we got a response — service IS running
      return {
        service: name,
        status: latency > 2000 ? 'degraded' : 'healthy',
        latency_ms: latency,
        last_checked: now,
        detail: `Reachable (${res.status} on all paths)`,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${path} → ${msg}`);

      // Connection failed — try next path before giving up
      if (path !== '/') continue;

      // All paths failed to connect — service is truly down
      return {
        service: name,
        status: 'down',
        latency_ms: null,
        last_checked: now,
        detail: `${base} — ${errors.join('; ')}`,
      };
    }
  }

  return { service: name, status: 'down', latency_ms: null, last_checked: now, detail: errors.join('; ') };
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const serviceClient = createAdminServiceClient();

  // Check Supabase health via a simple query
  const supabaseStart = Date.now();
  const { error: dbError } = await serviceClient
    .from('tenants')
    .select('id', { count: 'exact', head: true });
  const supabaseLatency = Date.now() - supabaseStart;

  const supabaseHealth: ServiceHealth = {
    service: 'supabase',
    status: dbError ? 'down' : supabaseLatency > 2000 ? 'degraded' : 'healthy',
    latency_ms: supabaseLatency,
    last_checked: new Date().toISOString(),
  };

  // Check external services — look for Railway URLs in env vars
  // Users should set these in Vercel env: RAILWAY_*_URL
  const apiGatewayUrl = process.env.RAILWAY_API_GATEWAY_URL || process.env.API_GATEWAY_URL;
  const aiServicesUrl = process.env.RAILWAY_AI_SERVICES_URL || process.env.AI_SERVICES_URL;
  const fileProcessorUrl = process.env.RAILWAY_FILE_PROCESSOR_URL || process.env.FILE_PROCESSOR_URL;
  const analyticsEngineUrl = process.env.RAILWAY_ANALYTICS_ENGINE_URL || process.env.ANALYTICS_ENGINE_URL;
  const realtimeGatewayUrl = process.env.RAILWAY_REALTIME_GATEWAY_URL || process.env.REALTIME_GATEWAY_URL;

  const serviceChecks = await Promise.all([
    checkService('api-gateway', apiGatewayUrl),
    checkService('ai-services', aiServicesUrl),
    checkService('file-processor', fileProcessorUrl),
    checkService('analytics-engine', analyticsEngineUrl),
    checkService('realtime-gateway', realtimeGatewayUrl),
  ]);

  const allServices: ServiceHealth[] = [
    // Next.js server is always healthy if we got this far
    {
      service: 'web-app',
      status: 'healthy',
      latency_ms: 0,
      last_checked: new Date().toISOString(),
    },
    supabaseHealth,
    ...serviceChecks,
  ];

  return NextResponse.json({ success: true, data: allServices });
}
