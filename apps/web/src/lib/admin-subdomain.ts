const ADMIN_SUBDOMAIN = 'admin';

/**
 * Server-side: check if the current request is on the admin subdomain.
 * Used in middleware and server components.
 */
export function isAdminSubdomain(hostname: string, baseDomain: string): boolean {
  return hostname === `${ADMIN_SUBDOMAIN}.${baseDomain}`;
}

/**
 * Client-side: check if the browser is on the admin subdomain.
 * Used in components like AdminShell to adjust navigation hrefs.
 */
export function isOnAdminSubdomain(): boolean {
  if (typeof window === 'undefined') return false;
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'ccdsuite.com';
  return window.location.hostname === `${ADMIN_SUBDOMAIN}.${baseDomain}`;
}

/**
 * Transforms an admin href for use on the admin subdomain.
 * On the admin subdomain, strips the /admin prefix since the middleware
 * handles the rewrite (e.g., /admin/users → /users).
 * On the main domain, returns the href unchanged.
 */
export function transformAdminHref(href: string, onSubdomain: boolean): string {
  if (!onSubdomain) return href;
  if (href === '/admin') return '/';
  return href.replace(/^\/admin/, '');
}
