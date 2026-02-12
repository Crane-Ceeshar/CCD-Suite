// Security headers mirrored from next.config.mjs so the admin security
// scanner can verify them via an internal self-fetch (localhost:PORT/api/health).
// Next.js custom headers() in next.config only apply when served through the
// framework's external routing layer — internal fetch() calls bypass them.
const securityHeaders: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' https://*.supabase.co data: blob:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(process.env.CSP_REPORT_URI ? [`report-uri ${process.env.CSP_REPORT_URI}`] : []),
  ].join('; '),
};

export async function GET() {
  return new Response('OK', { status: 200, headers: securityHeaders });
}

export async function HEAD() {
  return new Response(null, { status: 200, headers: securityHeaders });
}
