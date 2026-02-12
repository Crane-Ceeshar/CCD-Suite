import { NextRequest, NextResponse } from 'next/server';

/**
 * CSRF protection via Origin / Referer header validation.
 *
 * Verifies that state-changing requests (POST, PATCH, PUT, DELETE)
 * originate from the same site.
 */

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Get the allowed origins for CSRF validation.
 */
function getAllowedOrigins(): Set<string> {
  const origins = new Set<string>();

  // Add the app's own origin
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (appUrl) {
    try {
      origins.add(new URL(appUrl).origin);
    } catch { /* ignore */ }
  }

  // Allow localhost in development
  if (process.env.NODE_ENV === 'development') {
    origins.add('http://localhost:3000');
    origins.add('http://localhost:3001');
    origins.add('http://127.0.0.1:3000');
  }

  // Allow the base domain and all subdomains
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN;
  if (baseDomain) {
    origins.add(`https://${baseDomain}`);
    origins.add(`https://www.${baseDomain}`);
  }

  return origins;
}

/**
 * Validate CSRF protection for a request.
 *
 * Returns null if the request passes CSRF validation,
 * or a NextResponse with a 403 status if it fails.
 *
 * Usage in API routes:
 * ```ts
 * const csrfError = validateCsrf(request);
 * if (csrfError) return csrfError;
 * ```
 */
export function validateCsrf(request: NextRequest): NextResponse | null {
  // Safe methods don't need CSRF validation
  if (SAFE_METHODS.has(request.method)) {
    return null;
  }

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // Must have at least one of origin or referer
  if (!origin && !referer) {
    // Allow API calls without origin (e.g., server-to-server, Postman in dev)
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    return NextResponse.json(
      { success: false, error: { message: 'CSRF validation failed: missing origin' } },
      { status: 403 }
    );
  }

  const allowedOrigins = getAllowedOrigins();

  // Check Origin header first (most reliable)
  if (origin) {
    // In development, also accept the origin if it matches any allowed pattern
    if (allowedOrigins.has(origin)) {
      return null;
    }
    // Check if origin matches a subdomain of base domain
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN;
    if (baseDomain) {
      try {
        const originHost = new URL(origin).hostname;
        if (originHost.endsWith(`.${baseDomain}`) || originHost === baseDomain) {
          return null;
        }
      } catch { /* invalid origin */ }
    }
  }

  // Fallback: check Referer header
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (allowedOrigins.has(refererOrigin)) {
        return null;
      }
      const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN;
      if (baseDomain) {
        const refHost = new URL(referer).hostname;
        if (refHost.endsWith(`.${baseDomain}`) || refHost === baseDomain) {
          return null;
        }
      }
    } catch { /* invalid referer */ }
  }

  return NextResponse.json(
    { success: false, error: { message: 'CSRF validation failed: invalid origin' } },
    { status: 403 }
  );
}
