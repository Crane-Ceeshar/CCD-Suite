import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'portal_session';
const SESSION_SECRET = process.env.PORTAL_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'portal-session-secret-fallback';

export interface ClientSession {
  token_id: string;
  client_email: string;
  tenant_id: string;
  portal_project_id: string | null;
}

/**
 * Sign a payload with HMAC-SHA256
 */
function sign(payload: string): string {
  return crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
}

/**
 * Create a signed session cookie value
 */
function encode(session: ClientSession): string {
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

/**
 * Decode and verify a signed session cookie value
 */
function decode(value: string): ClientSession | null {
  const parts = value.split('.');
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  const expectedSignature = sign(payload);

  // Constant-time comparison
  if (signature.length !== expectedSignature.length) return null;
  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSignature);
  if (!crypto.timingSafeEqual(a, b)) return null;

  try {
    const json = Buffer.from(payload, 'base64url').toString('utf-8');
    return JSON.parse(json) as ClientSession;
  } catch {
    return null;
  }
}

/**
 * Set the client session cookie on a NextResponse
 */
export function setClientSession(response: NextResponse, session: ClientSession): void {
  const value = encode(session);
  response.cookies.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

/**
 * Get the client session from a NextRequest's cookies.
 * Returns null if no valid session exists.
 */
export function getClientSession(request: NextRequest): ClientSession | null {
  const cookie = request.cookies.get(COOKIE_NAME);
  if (!cookie?.value) return null;
  return decode(cookie.value);
}

/**
 * Get client session from a cookies() call (for API routes that read request cookies)
 */
export function getClientSessionFromCookieValue(cookieValue: string | undefined): ClientSession | null {
  if (!cookieValue) return null;
  return decode(cookieValue);
}

/**
 * Clear the client session cookie
 */
export function clearClientSession(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/**
 * The cookie name (exported for middleware use)
 */
export { COOKIE_NAME };
