import { NextResponse } from 'next/server';

export function success<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function error(message: string, status = 500) {
  return NextResponse.json(
    { success: false, error: { message } },
    { status }
  );
}

export function notFound(entity: string) {
  return error(`${entity} not found`, 404);
}

export function validationError(issues: { path: string; message: string }[]) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message: issues.map((i) => `${i.path}: ${i.message}`).join('; '),
        issues,
      },
    },
    { status: 400 }
  );
}

/**
 * Sanitize a Supabase/Postgres error for client consumption.
 * Never leak internal details like constraint names or SQL fragments.
 */
export function dbError(err: { message: string; code?: string }, fallback: string) {
  if (err.code === 'PGRST116') return notFound(fallback);
  if (err.code === '23505') return error('A record with that value already exists', 409);
  if (err.code === '23503') return error('Referenced record does not exist', 400);
  // Generic — hide raw Postgres message
  console.error(`DB error [${err.code}]:`, err.message);
  return error(fallback, 500);
}
