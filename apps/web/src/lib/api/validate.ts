import { type ZodType, type ZodTypeDef } from 'zod';
import { validationError } from './responses';

type ValidationResult<T> =
  | { data: T; error: null }
  | { data: null; error: ReturnType<typeof validationError> };

/** Default max body size: 1 MB */
const DEFAULT_MAX_BODY_SIZE = 1 * 1024 * 1024;
/** Max body size for file uploads: 10 MB */
export const MAX_UPLOAD_BODY_SIZE = 10 * 1024 * 1024;

export async function validateBody<O, D extends ZodTypeDef, I>(
  request: Request,
  schema: ZodType<O, D, I>,
  options?: { maxSize?: number }
): Promise<ValidationResult<O>> {
  // Check Content-Length if provided
  const contentLength = request.headers.get('content-length');
  const maxSize = options?.maxSize ?? DEFAULT_MAX_BODY_SIZE;

  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (!isNaN(size) && size > maxSize) {
      return {
        data: null,
        error: validationError([
          {
            path: 'body',
            message: `Request body too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`,
          },
        ]),
      };
    }
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      data: null,
      error: validationError([{ path: 'body', message: 'Invalid JSON' }]),
    };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    return {
      data: null,
      error: validationError(
        result.error.issues.map((i) => ({
          path: i.path.join('.') || 'body',
          message: i.message,
        }))
      ),
    };
  }

  return { data: result.data, error: null };
}

export function validateQuery<O, D extends ZodTypeDef, I>(
  searchParams: URLSearchParams,
  schema: ZodType<O, D, I>
): ValidationResult<O> {
  const raw: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    raw[key] = value;
  });

  const result = schema.safeParse(raw);
  if (!result.success) {
    return {
      data: null,
      error: validationError(
        result.error.issues.map((i) => ({
          path: i.path.join('.') || 'query',
          message: i.message,
        }))
      ),
    };
  }

  return { data: result.data, error: null };
}
