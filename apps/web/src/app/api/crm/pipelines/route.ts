import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { dbError, success } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { createPipelineSchema } from '@/lib/api/schemas/crm';
import { rateLimit } from '@/lib/api/rate-limit';
import { validateCsrf } from '@/lib/api/csrf';
import { logAudit } from '@/lib/api/audit';
import { sanitizeObject } from '@/lib/api/sanitize';

export async function GET() {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'crm:pipelines:list' });
  if (limited) return limitResp!;

  const { data, error: queryError } = await supabase
    .from('pipelines')
    .select('*, stages:pipeline_stages(*)')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });

  if (queryError) {
    return dbError(queryError, 'Failed to fetch pipelines');
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
  const csrfError = validateCsrf(request);
  if (csrfError) return csrfError;

  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 20, keyPrefix: 'crm:pipelines:create' });
  if (limited) return limitResp!;

  const { data: rawBody, error: bodyError } = await validateBody(request, createPipelineSchema);
  if (bodyError) return bodyError;
  const body = sanitizeObject(rawBody as Record<string, unknown>) as typeof rawBody;

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
    return dbError(insertError, 'Failed to create pipeline');
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

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'pipeline.created',
    resource_type: 'pipeline',
    resource_id: (pipeline as { id: string }).id,
    details: { name: body.name },
  });

  return success(fullPipeline, 201);
}
