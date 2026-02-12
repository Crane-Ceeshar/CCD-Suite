import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimitByIp, RATE_LIMIT_PRESETS } from '@/lib/api/rate-limit';
import { logSecurityEvent } from '@/lib/api/security-events';

export async function POST(request: NextRequest) {
  const { limited, response, ip } = rateLimitByIp(request, RATE_LIMIT_PRESETS.publicForm);
  if (limited) return response!;

  let report: Record<string, unknown>;
  try {
    const body = await request.json();
    report = (body['csp-report'] || body) as Record<string, unknown>;
  } catch {
    return new Response(null, { status: 400 });
  }

  const supabase = await createClient();

  await logSecurityEvent(supabase, {
    type: 'suspicious_request',
    severity: 'low',
    sourceIp: ip,
    endpoint: String(report['document-uri'] || ''),
    details: {
      violated_directive: report['violated-directive'],
      blocked_uri: report['blocked-uri'],
      original_policy: report['original-policy'],
      source_file: report['source-file'],
      line_number: report['line-number'],
    },
  });

  return new Response(null, { status: 204 });
}
