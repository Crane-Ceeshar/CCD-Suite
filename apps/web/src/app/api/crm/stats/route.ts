import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';

export async function GET() {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  try {
    const [dealsRes, contactsRes, companiesRes, wonRes, totalClosedRes] = await Promise.all([
      supabase.from('deals').select('value', { count: 'exact' }),
      supabase.from('contacts').select('id', { count: 'exact', head: true }),
      supabase.from('companies').select('id', { count: 'exact', head: true }),
      supabase.from('deals').select('id', { count: 'exact', head: true }).eq('status', 'won'),
      supabase.from('deals').select('id', { count: 'exact', head: true }).in('status', ['won', 'lost']),
    ]);

    const dealCount = dealsRes.count ?? 0;
    const pipelineValue = (dealsRes.data ?? [])
      .filter((d: { value: number }) => d.value)
      .reduce((sum: number, d: { value: number }) => sum + (d.value ?? 0), 0);
    const contactCount = contactsRes.count ?? 0;
    const companyCount = companiesRes.count ?? 0;
    const wonCount = wonRes.count ?? 0;
    const totalClosed = totalClosedRes.count ?? 0;
    const winRate = totalClosed > 0 ? Math.round((wonCount / totalClosed) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        deals: dealCount,
        pipeline_value: pipelineValue,
        contacts: contactCount,
        companies: companyCount,
        win_rate: winRate,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch stats' } },
      { status: 500 }
    );
  }
}
