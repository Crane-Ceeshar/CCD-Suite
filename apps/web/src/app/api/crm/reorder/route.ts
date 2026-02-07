import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';

const ALLOWED_TABLES = ['contacts', 'companies', 'activities', 'products'] as const;
type AllowedTable = (typeof ALLOWED_TABLES)[number];

export async function POST(request: NextRequest) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const body = await request.json();
  const { table, items } = body as {
    table: string;
    items: { id: string; sort_order: number }[];
  };

  if (!ALLOWED_TABLES.includes(table as AllowedTable)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid table' } },
      { status: 400 }
    );
  }

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { success: false, error: { message: 'Items array is required' } },
      { status: 400 }
    );
  }

  // Batch update sort_order for each item
  const updates = items.map(({ id, sort_order }) =>
    supabase
      .from(table)
      .update({ sort_order })
      .eq('id', id)
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);

  if (failed?.error) {
    return NextResponse.json(
      { success: false, error: { message: failed.error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
