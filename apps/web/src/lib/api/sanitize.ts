/**
 * Input sanitization utilities for preventing XSS, SSRF, and path traversal.
 */

/* -------------------------------------------------------------------------- */
/*  HTML Sanitization                                                          */
/* -------------------------------------------------------------------------- */

/** Dangerous HTML tags that should always be stripped */
const DANGEROUS_TAGS =
  /(<\s*\/?\s*(script|iframe|object|embed|form|link|meta|style|svg|math|base|applet|body|head|html|frameset|frame|layer|ilayer|bgsound|title|xml)[^>]*>)/gi;

/** Dangerous HTML attributes / event handlers */
const DANGEROUS_ATTRS =
  /\s*(on\w+|formaction|xlink:href|data-bind|srcdoc|action)\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi;

/** javascript: / vbscript: / data: protocol in href / src */
const DANGEROUS_PROTOCOLS = /(href|src|action)\s*=\s*["']?\s*(javascript|vbscript|data)\s*:/gi;

/**
 * Strip dangerous HTML tags, attributes, and protocol handlers.
 * Leaves safe text and basic formatting intact.
 */
export function sanitizeHtml(input: string): string {
  if (!input) return input;
  return input
    .replace(DANGEROUS_TAGS, '')
    .replace(DANGEROUS_ATTRS, '')
    .replace(DANGEROUS_PROTOCOLS, '$1=""');
}

/**
 * Check if a string contains potentially dangerous HTML content.
 */
export function containsUnsafeHtml(input: string): boolean {
  if (!input) return false;
  return (
    DANGEROUS_TAGS.test(input) ||
    DANGEROUS_ATTRS.test(input) ||
    DANGEROUS_PROTOCOLS.test(input)
  );
}

/* -------------------------------------------------------------------------- */
/*  Search Query Sanitization                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Sanitize search input for use in ILIKE / text search queries.
 * Escapes SQL-like metacharacters to prevent injection.
 */
export function sanitizeSearchQuery(input: string): string {
  if (!input) return input;
  // Escape SQL LIKE metacharacters and backslash
  return input
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/'/g, "''")
    .trim()
    .slice(0, 200); // Cap search length
}

/* -------------------------------------------------------------------------- */
/*  URL Validation (SSRF Prevention)                                           */
/* -------------------------------------------------------------------------- */

/** Private / internal IPv4 ranges */
const PRIVATE_IP_RANGES = [
  /^127\./,                        // Loopback
  /^10\./,                         // Class A private
  /^172\.(1[6-9]|2\d|3[01])\./,   // Class B private
  /^192\.168\./,                   // Class C private
  /^169\.254\./,                   // Link-local
  /^0\./,                          // "This" network
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // Shared address space
];

const BLOCKED_HOSTNAMES = [
  'localhost',
  '0.0.0.0',
  '[::1]',
  'metadata.google.internal',       // GCP metadata
  'instance-data',                  // AWS metadata alias
];

/**
 * Validate a URL is safe to fetch (no SSRF).
 * Returns { valid: true, url } or { valid: false, reason }.
 */
export function validateUrl(input: string): { valid: true; url: URL } | { valid: false; reason: string } {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return { valid: false, reason: 'Invalid URL format' };
  }

  // Only allow HTTP(S)
  if (!['http:', 'https:'].includes(url.protocol)) {
    return { valid: false, reason: `Blocked protocol: ${url.protocol}` };
  }

  const hostname = url.hostname.toLowerCase();

  // Block known internal hostnames
  if (BLOCKED_HOSTNAMES.some((h) => hostname === h || hostname.endsWith(`.${h}`))) {
    return { valid: false, reason: 'Internal hostname not allowed' };
  }

  // Block private IP ranges
  if (PRIVATE_IP_RANGES.some((re) => re.test(hostname))) {
    return { valid: false, reason: 'Private IP address not allowed' };
  }

  // Block AWS metadata endpoint
  if (hostname === '169.254.169.254') {
    return { valid: false, reason: 'Cloud metadata endpoint not allowed' };
  }

  return { valid: true, url };
}

/* -------------------------------------------------------------------------- */
/*  Filename Sanitization                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Sanitize a filename to prevent path traversal and special chars.
 */
export function sanitizeFilename(input: string): string {
  if (!input) return 'unnamed';
  return input
    // Remove path traversal
    .replace(/\.\./g, '')
    .replace(/[/\\]/g, '')
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove special characters, keep letters, numbers, dash, underscore, dot
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    // Remove leading dots (hidden files)
    .replace(/^\.+/, '')
    // Limit length
    .slice(0, 255)
    || 'unnamed';
}

/* -------------------------------------------------------------------------- */
/*  General Input Sanitization                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Sanitize a string value for storage — strips dangerous HTML
 * and trims whitespace.
 */
export function sanitizeInput(input: string): string {
  if (!input) return input;
  return sanitizeHtml(input.trim());
}

/**
 * Recursively sanitize all string values in an object.
 * Useful for sanitizing entire request bodies.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    const value = result[key];
    if (typeof value === 'string') {
      (result as Record<string, unknown>)[key] = sanitizeInput(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      (result as Record<string, unknown>)[key] = sanitizeObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      (result as Record<string, unknown>)[key] = value.map((item) =>
        typeof item === 'string'
          ? sanitizeInput(item)
          : item && typeof item === 'object'
            ? sanitizeObject(item as Record<string, unknown>)
            : item
      );
    }
  }
  return result;
}
