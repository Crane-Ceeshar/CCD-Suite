import { type ZodType, type ZodTypeDef } from 'zod';
import { validationError } from './responses';

type ValidationResult<T> =
  | { data: T; error: null }
  | { data: null; error: ReturnType<typeof validationError> };

export async function validateBody<O, D extends ZodTypeDef, I>(
  request: Request,
  schema: ZodType<O, D, I>
): Promise<ValidationResult<O>> {
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
