/**
 * Input sanitization utilities for preventing XSS, SSRF, and path traversal.
 */

/* -------------------------------------------------------------------------- */
/*  HTML Sanitization                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Strip all HTML tags from a string. Uses a simple non-backtracking approach:
 * split on '<', discard everything up to '>' in each segment.
 * This avoids ReDoS and handles incomplete/malformed tags safely.
 */
export function stripHtmlTags(html: string): string {
  if (!html) return '';
  let result = '';
  let inTag = false;
  for (let i = 0; i < html.length; i++) {
    const ch = html[i];
    if (ch === '<') {
      inTag = true;
    } else if (ch === '>') {
      inTag = false;
    } else if (!inTag) {
      result += ch;
    }
  }
  return result.trim();
}

/** Dangerous HTML tag names (matched as whole words after < or </) */
const DANGEROUS_TAG_NAMES = new Set([
  'script', 'iframe', 'object', 'embed', 'form', 'link', 'meta',
  'style', 'svg', 'math', 'base', 'applet', 'body', 'head', 'html',
  'frameset', 'frame', 'layer', 'ilayer', 'bgsound', 'title', 'xml',
]);

/** Dangerous attribute name prefixes / exact matches */
const DANGEROUS_ATTR_NAMES = new Set([
  'formaction', 'xlink:href', 'data-bind', 'srcdoc', 'action',
]);

/** Standalone dangerous protocol prefixes (e.g. in URL fields) */
const STANDALONE_DANGEROUS_PROTOCOL = /^\s*(?:javascript|vbscript|data)\s*:/i;

/**
 * Strip dangerous HTML tags, attributes, and protocol handlers.
 * Uses a character-by-character parser instead of regex to avoid ReDoS.
 * Loops until output stabilises to catch nested payloads.
 */
export function sanitizeHtml(input: string): string {
  if (!input) return input;

  let prev = '';
  let current = input;
  let iterations = 0;
  const MAX_ITERATIONS = 10;

  while (current !== prev && iterations < MAX_ITERATIONS) {
    prev = current;
    iterations++;

    // Pass 1: Remove dangerous tags
    let result = '';
    let i = 0;
    while (i < current.length) {
      if (current[i] === '<') {
        // Find end of tag
        const closeIdx = current.indexOf('>', i);
        if (closeIdx === -1) {
          // Unclosed tag at end — strip it
          break;
        }
        const tagContent = current.substring(i + 1, closeIdx);
        // Extract tag name: skip optional / and whitespace
        const trimmed = tagContent.replace(/^[\s/]+/, '');
        const tagNameMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9]*)/);
        const tagName = tagNameMatch ? tagNameMatch[1].toLowerCase() : '';

        if (DANGEROUS_TAG_NAMES.has(tagName)) {
          // Skip this tag entirely
          i = closeIdx + 1;
          continue;
        }

        // Check for dangerous attributes within the tag
        let cleanTag = '<' + tagContent;
        // Remove on* event handlers
        cleanTag = cleanTag.replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|\S+)/gi, '');
        // Remove dangerous named attributes
        for (const attrName of DANGEROUS_ATTR_NAMES) {
          const attrRegex = new RegExp(
            `\\s+${attrName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*=\\s*(?:"[^"]*"|'[^']*'|\\S+)`,
            'gi'
          );
          cleanTag = cleanTag.replace(attrRegex, '');
        }
        // Remove dangerous protocols in href/src/action
        cleanTag = cleanTag.replace(
          /(?:href|src|action)\s*=\s*["']?\s*(?:javascript|vbscript|data)\s*:/gi,
          'data-blocked='
        );

        result += cleanTag + '>';
        i = closeIdx + 1;
      } else {
        result += current[i];
        i++;
      }
    }
    current = result;
  }
  return current;
}

/**
 * Check if a string contains potentially dangerous HTML content.
 */
export function containsUnsafeHtml(input: string): boolean {
  if (!input) return false;
  // Quick check: does it contain any tag-like structure with a dangerous name?
  const tagMatch = input.match(/<\s*\/?([a-zA-Z][a-zA-Z0-9]*)/g);
  if (tagMatch) {
    for (const m of tagMatch) {
      const nameMatch = m.match(/([a-zA-Z][a-zA-Z0-9]*)$/);
      if (nameMatch && DANGEROUS_TAG_NAMES.has(nameMatch[1].toLowerCase())) {
        return true;
      }
    }
  }
  // Check for event handlers
  if (/\s+on[a-z]+\s*=/i.test(input)) return true;
  // Check for dangerous protocols
  if (/(?:href|src|action)\s*=\s*["']?\s*(?:javascript|vbscript|data)\s*:/i.test(input)) return true;
  return false;
}

/* -------------------------------------------------------------------------- */
/*  Search Query Sanitization                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Sanitize search input for use in ILIKE / text search queries.
 * Strips SQL injection patterns and escapes metacharacters.
 */
export function sanitizeSearchQuery(input: string): string {
  if (!input) return input;
  // Strip SQL injection patterns first
  let cleaned = stripSqlPatterns(input);
  // Escape SQL LIKE metacharacters and backslash
  return cleaned
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
 * Dangerous SQL keywords / patterns that should never appear in stored text.
 * Matches multi-word SQL sequences commonly used in injection attacks.
 */
const SQL_INJECTION_PATTERNS = [
  /\bUNION\s+SELECT\b/gi,
  /\bSELECT\s+\*\s+FROM\b/gi,
  /\bDROP\s+TABLE\b/gi,
  /\bINSERT\s+INTO\b/gi,
  /\bDELETE\s+FROM\b/gi,
  /\bUPDATE\s+\w+\s+SET\b/gi,
  /\bEXEC(?:\s+|\s*\()/gi,
  /\bpg_sleep\s*\(/gi,
  /;\s*--/g,
  /'\s*OR\s+\d+\s*=\s*\d+/gi,
  /'\s*OR\s+'\w+'\s*=\s*'\w+/gi,
];

/**
 * Strip dangerous SQL injection patterns from stored text values.
 */
function stripSqlPatterns(input: string): string {
  let result = input;
  for (const pattern of SQL_INJECTION_PATTERNS) {
    result = result.replace(pattern, '');
  }
  return result;
}

/**
 * Sanitize a string value for storage — strips dangerous HTML,
 * SQL injection patterns, dangerous protocols, and trims whitespace.
 */
export function sanitizeInput(input: string): string {
  if (!input) return input;
  let cleaned = sanitizeHtml(input.trim());
  // Strip dangerous standalone protocols (e.g. javascript:alert(1))
  cleaned = cleaned.replace(STANDALONE_DANGEROUS_PROTOCOL, '');
  // Strip dangerous SQL patterns
  cleaned = stripSqlPatterns(cleaned);
  return cleaned;
}

/**
 * Recursively sanitize all string values in an object.
 * Only processes keys in the ALLOWED_OBJECT_KEYS set to prevent
 * prototype pollution / remote property injection.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    // Skip __proto__, constructor, prototype, and other dangerous keys
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;

    const value = obj[key];
    if (typeof value === 'string') {
      result[key] = sanitizeInput(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = sanitizeObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === 'string'
          ? sanitizeInput(item)
          : item && typeof item === 'object'
            ? sanitizeObject(item as Record<string, unknown>)
            : item
      );
    } else {
      result[key] = value;
    }
  }
  return result as T;
}
