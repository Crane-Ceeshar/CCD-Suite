import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { createAdminServiceClient } from '@/lib/supabase/admin';

interface ApiKeyValidation {
  valid: boolean;
  tenantId?: string;
  scopes?: string[];
  keyId?: string;
  error?: string;
}

/**
 * Validate an API key from the Authorization header.
 *
 * Expects format: `Bearer ccd_xxxxx`
 *
 * Uses the service role client to bypass RLS on `api_keys` (which is
 * restricted to admin-only access). Updates `last_used_at` on success.
 *
 * @param authHeader - The raw Authorization header value
 * @returns Validation result with tenant context if valid
 */
export async function validateApiKey(
  authHeader: string | null
): Promise<ApiKeyValidation> {
  if (!authHeader) {
    return { valid: false, error: 'Missing Authorization header' };
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token.startsWith('ccd_')) {
    return { valid: false, error: 'Invalid API key format' };
  }

  const keyHash = createHash('sha256').update(token).digest('hex');
  const serviceClient = createAdminServiceClient();

  const { data: apiKey, error } = await serviceClient
    .from('api_keys')
    .select('id, tenant_id, scopes, is_active, expires_at')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !apiKey) {
    return { valid: false, error: 'Invalid API key' };
  }

  // Check expiry
  if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
    return { valid: false, error: 'API key has expired' };
  }

  // Update last_used_at (fire-and-forget)
  serviceClient
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', apiKey.id)
    .then(() => {});

  return {
    valid: true,
    tenantId: apiKey.tenant_id,
    scopes: apiKey.scopes ?? [],
    keyId: apiKey.id,
  };
}

/**
 * Check if an API key has a specific scope (or the wildcard `*` scope).
 */
export function hasScope(scopes: string[], required: string): boolean {
  return scopes.includes('*') || scopes.includes(required);
}

/**
 * Guard function for API routes that accept API key authentication.
 *
 * Returns tenant context instead of user context. Use alongside
 * `requireAuth()` for routes that support both session and API key auth.
 *
 * @param authHeader    - The raw Authorization header value
 * @param requiredScope - Optional scope the key must have (e.g. "crm:read")
 */
export async function requireApiKey(
  authHeader: string | null,
  requiredScope?: string
) {
  const result = await validateApiKey(authHeader);

  if (!result.valid) {
    return {
      error: NextResponse.json(
        { success: false, error: { message: result.error } },
        { status: 401 }
      ),
      tenantId: null as unknown as string,
      scopes: null as unknown as string[],
      keyId: null as unknown as string,
    };
  }

  if (requiredScope && !hasScope(result.scopes!, requiredScope)) {
    return {
      error: NextResponse.json(
        { success: false, error: { message: `Missing required scope: ${requiredScope}` } },
        { status: 403 }
      ),
      tenantId: null as unknown as string,
      scopes: null as unknown as string[],
      keyId: null as unknown as string,
    };
  }

  return {
    error: null,
    tenantId: result.tenantId!,
    scopes: result.scopes!,
    keyId: result.keyId!,
  };
}
