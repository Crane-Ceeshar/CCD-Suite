import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';

export async function GET() {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { data, error: queryError } = await supabase
    .from('pipelines')
    .select('*, stages:pipeline_stages(*)')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });

  if (queryError) {
    return NextResponse.json(
      { success: false, error: { message: queryError.message } },
      { status: 500 }
    );
  }

  // Sort stages by position within each pipeline
  const pipelines = (data ?? []).map((p: Record<string, unknown>) => ({
    ...p,
    stages: ((p.stages as Array<{ position: number }>) ?? []).sort(
      (a: { position: number }, b: { position: number }) => a.position - b.position
    ),
  }));

  return NextResponse.json({ success: true, data: pipelines });
}

export async function POST(request: NextRequest) {
  const { error, supabase, profile } = await requireAuth();
  if (error) return error;

  const body = await request.json();

  const { data: pipeline, error: insertError } = await supabase
    .from('pipelines')
    .insert({
      tenant_id: profile.tenant_id,
      name: body.name,
      is_default: body.is_default ?? false,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json(
      { success: false, error: { message: insertError.message } },
      { status: 500 }
    );
  }

  // Create default stages
  const defaultStages = [
    { name: 'Lead', position: 0, color: '#94a3b8', probability: 10 },
    { name: 'Qualified', position: 1, color: '#3b82f6', probability: 25 },
    { name: 'Proposal', position: 2, color: '#8b5cf6', probability: 50 },
    { name: 'Negotiation', position: 3, color: '#f59e0b', probability: 75 },
    { name: 'Closed Won', position: 4, color: '#22c55e', probability: 100 },
  ];

  await supabase.from('pipeline_stages').insert(
    defaultStages.map((s) => ({
      ...s,
      pipeline_id: (pipeline as { id: string }).id,
    }))
  );

  // Fetch pipeline with stages
  const { data: fullPipeline } = await supabase
    .from('pipelines')
    .select('*, stages:pipeline_stages(*)')
    .eq('id', (pipeline as { id: string }).id)
    .single();

  return NextResponse.json({ success: true, data: fullPipeline }, { status: 201 });
}
