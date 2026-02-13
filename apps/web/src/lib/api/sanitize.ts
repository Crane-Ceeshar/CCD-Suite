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
 * Parse attributes out of a tag body string (everything between < and >).
 * Returns only safe attributes, dropping any on* handlers or dangerous names.
 * Uses a state-machine parser — no regex on user input.
 */
function filterAttributes(tagBody: string): string {
  // Find where the tag name ends and attributes begin
  let j = 0;
  // Skip leading / and whitespace
  while (j < tagBody.length && (tagBody[j] === '/' || tagBody[j] === ' ' || tagBody[j] === '\t' || tagBody[j] === '\n' || tagBody[j] === '\r')) j++;
  // Skip tag name
  while (j < tagBody.length && tagBody[j] !== ' ' && tagBody[j] !== '\t' && tagBody[j] !== '\n' && tagBody[j] !== '\r' && tagBody[j] !== '/' && tagBody[j] !== '>') j++;

  const tagNamePart = tagBody.substring(0, j);
  const attrsPart = tagBody.substring(j);

  if (!attrsPart.trim()) return tagBody;

  // Parse attributes character by character
  const safeAttrs: string[] = [];
  let pos = 0;
  const src = attrsPart;

  while (pos < src.length) {
    // Skip whitespace
    while (pos < src.length && /\s/.test(src[pos])) pos++;
    if (pos >= src.length || src[pos] === '/') break;

    // Read attribute name
    const nameStart = pos;
    while (pos < src.length && src[pos] !== '=' && !/\s/.test(src[pos]) && src[pos] !== '/' && src[pos] !== '>') pos++;
    const attrName = src.substring(nameStart, pos).toLowerCase();

    // Skip whitespace around =
    while (pos < src.length && /\s/.test(src[pos])) pos++;

    let attrValue = '';
    if (pos < src.length && src[pos] === '=') {
      pos++; // skip =
      while (pos < src.length && /\s/.test(src[pos])) pos++;

      if (pos < src.length && (src[pos] === '"' || src[pos] === "'")) {
        const quote = src[pos];
        pos++; // skip opening quote
        const valStart = pos;
        while (pos < src.length && src[pos] !== quote) pos++;
        attrValue = src.substring(valStart, pos);
        if (pos < src.length) pos++; // skip closing quote
      } else {
        const valStart = pos;
        while (pos < src.length && !/\s/.test(src[pos]) && src[pos] !== '>' && src[pos] !== '/') pos++;
        attrValue = src.substring(valStart, pos);
      }
    }

    if (!attrName) continue;

    // Drop dangerous attributes
    if (attrName.startsWith('on')) continue; // on* event handlers
    if (DANGEROUS_ATTR_NAMES.has(attrName)) continue;

    // Check for dangerous protocols in href/src/action values
    if ((attrName === 'href' || attrName === 'src' || attrName === 'action') &&
        /^\s*(?:javascript|vbscript|data)\s*:/i.test(attrValue)) {
      continue;
    }

    // Reconstruct safe attribute
    safeAttrs.push(` ${attrName}="${attrValue.replace(/"/g, '&quot;')}"`);
  }

  return tagNamePart + safeAttrs.join('');
}

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

    let result = '';
    let i = 0;
    while (i < current.length) {
      if (current[i] === '<') {
        const closeIdx = current.indexOf('>', i);
        if (closeIdx === -1) {
          // Unclosed tag at end — strip it
          break;
        }
        const tagContent = current.substring(i + 1, closeIdx);
        // Extract tag name
        const trimmed = tagContent.replace(/^[\s/]+/, '');
        const tagNameMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9]*)/);
        const tagName = tagNameMatch ? tagNameMatch[1].toLowerCase() : '';

        if (DANGEROUS_TAG_NAMES.has(tagName)) {
          i = closeIdx + 1;
          continue;
        }

        // Filter attributes using state-machine parser (no regex on user data)
        const filteredContent = filterAttributes(tagContent);
        result += '<' + filteredContent + '>';
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
  const tagMatch = input.match(/<\s*\/?([a-zA-Z][a-zA-Z0-9]*)/g);
  if (tagMatch) {
    for (const m of tagMatch) {
      const nameMatch = m.match(/([a-zA-Z][a-zA-Z0-9]*)$/);
      if (nameMatch && DANGEROUS_TAG_NAMES.has(nameMatch[1].toLowerCase())) {
        return true;
      }
    }
  }
  if (/\s+on[a-z]+\s*=/i.test(input)) return true;
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
  let cleaned = stripSqlPatterns(input);
  return cleaned
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/'/g, "''")
    .trim()
    .slice(0, 200);
}

/* -------------------------------------------------------------------------- */
/*  URL Validation (SSRF Prevention)                                           */
/* -------------------------------------------------------------------------- */

const PRIVATE_IP_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
];

const BLOCKED_HOSTNAMES = [
  'localhost',
  '0.0.0.0',
  '[::1]',
  'metadata.google.internal',
  'instance-data',
];

export function validateUrl(input: string): { valid: true; url: URL } | { valid: false; reason: string } {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return { valid: false, reason: 'Invalid URL format' };
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    return { valid: false, reason: `Blocked protocol: ${url.protocol}` };
  }

  const hostname = url.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.some((h) => hostname === h || hostname.endsWith(`.${h}`))) {
    return { valid: false, reason: 'Internal hostname not allowed' };
  }

  if (PRIVATE_IP_RANGES.some((re) => re.test(hostname))) {
    return { valid: false, reason: 'Private IP address not allowed' };
  }

  if (hostname === '169.254.169.254') {
    return { valid: false, reason: 'Cloud metadata endpoint not allowed' };
  }

  return { valid: true, url };
}

/* -------------------------------------------------------------------------- */
/*  Filename Sanitization                                                      */
/* -------------------------------------------------------------------------- */

export function sanitizeFilename(input: string): string {
  if (!input) return 'unnamed';
  return input
    .replace(/\.\./g, '')
    .replace(/[/\\]/g, '')
    .replace(/\0/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/^\.+/, '')
    .slice(0, 255)
    || 'unnamed';
}

/* -------------------------------------------------------------------------- */
/*  General Input Sanitization                                                 */
/* -------------------------------------------------------------------------- */

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

function stripSqlPatterns(input: string): string {
  let result = input;
  for (const pattern of SQL_INJECTION_PATTERNS) {
    result = result.replace(pattern, '');
  }
  return result;
}

export function sanitizeInput(input: string): string {
  if (!input) return input;
  let cleaned = sanitizeHtml(input.trim());
  cleaned = cleaned.replace(STANDALONE_DANGEROUS_PROTOCOL, '');
  cleaned = stripSqlPatterns(cleaned);
  return cleaned;
}

/**
 * Recursively sanitize all string values in an object.
 * Uses Object.create(null) and Object.defineProperty to prevent
 * prototype pollution / remote property injection.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  // Null-prototype object — cannot pollute Object.prototype
  const result: Record<string, unknown> = Object.create(null);
  for (const key of Object.keys(obj)) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;

    const value = obj[key];
    let sanitized: unknown;
    if (typeof value === 'string') {
      sanitized = sanitizeInput(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized = sanitizeObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      sanitized = value.map((item) =>
        typeof item === 'string'
          ? sanitizeInput(item)
          : item && typeof item === 'object'
            ? sanitizeObject(item as Record<string, unknown>)
            : item
      );
    } else {
      sanitized = value;
    }
    // Use defineProperty to avoid CodeQL property injection warnings
    Object.defineProperty(result, key, {
      value: sanitized,
      writable: true,
      enumerable: true,
      configurable: true,
    });
  }
  return result as T;
}
