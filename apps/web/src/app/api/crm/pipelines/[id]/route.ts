import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { data, error: queryError } = await supabase
    .from('pipelines')
    .select(
      '*, stages:pipeline_stages(*, deals(*, company:companies(id, name), contact:contacts(id, first_name, last_name)))'
    )
    .eq('id', id)
    .single();

  if (queryError) {
    return NextResponse.json(
      { success: false, error: { message: queryError.message } },
      { status: 404 }
    );
  }

  // Sort stages by position, and deals within each stage by position
  interface DealWithPosition {
    position: number;
    [key: string]: unknown;
  }
  interface StageWithDeals {
    position: number;
    deals: DealWithPosition[];
    [key: string]: unknown;
  }

  const pipeline = {
    ...data,
    stages: ((data as { stages: StageWithDeals[] }).stages ?? [])
      .sort((a: StageWithDeals, b: StageWithDeals) => a.position - b.position)
      .map((stage: StageWithDeals) => ({
        ...stage,
        deals: (stage.deals ?? []).sort(
          (a: DealWithPosition, b: DealWithPosition) => a.position - b.position
        ),
      })),
  };

  return NextResponse.json({ success: true, data: pipeline });
}
