import { NextResponse } from 'next/server';
import { requireAdmin, createAdminServiceClient } from '@/lib/supabase/admin';

interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  latency_ms: number | null;
  last_checked: string;
}

async function checkService(
  name: string,
  url: string | undefined
): Promise<ServiceHealth> {
  const now = new Date().toISOString();

  if (!url) {
    return { service: name, status: 'unknown', latency_ms: null, last_checked: now };
  }

  try {
    const start = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    const latency = Date.now() - start;
    const status = res.ok ? (latency > 2000 ? 'degraded' : 'healthy') : 'down';

    return { service: name, status, latency_ms: latency, last_checked: now };
  } catch {
    return { service: name, status: 'down', latency_ms: null, last_checked: now };
  }
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
    checkService(
      'api-gateway',
      apiGatewayUrl ? `${apiGatewayUrl.replace(/\/$/, '')}/health` : undefined
    ),
    checkService(
      'ai-services',
      aiServicesUrl ? `${aiServicesUrl.replace(/\/$/, '')}/health` : undefined
    ),
    checkService(
      'file-processor',
      fileProcessorUrl ? `${fileProcessorUrl.replace(/\/$/, '')}/health` : undefined
    ),
    checkService(
      'analytics-engine',
      analyticsEngineUrl ? `${analyticsEngineUrl.replace(/\/$/, '')}/health` : undefined
    ),
    checkService(
      'realtime-gateway',
      realtimeGatewayUrl ? `${realtimeGatewayUrl.replace(/\/$/, '')}/health` : undefined
    ),
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
