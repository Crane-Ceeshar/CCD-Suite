/**
 * Returns the cookie domain for cross-subdomain session sharing.
 * In development, returns undefined (browser default = current hostname).
 * In production, returns '.ccdsuite.com' so cookies work across all subdomains
 * (e.g., ccdsuite.com and admin.ccdsuite.com).
 */
export function getCookieDomain(): string | undefined {
  if (process.env.NODE_ENV === 'development') return undefined;
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'ccdsuite.com';
  return `.${baseDomain}`;
}
