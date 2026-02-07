import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const { error, supabase, profile } = await requireAdmin();
  if (error) return error;

  const { data: settings } = await supabase
    .from('ai_settings')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
    .single();

  // Return null if not configured yet (frontend handles this)
  return NextResponse.json({ success: true, data: settings ?? null });
}

export async function PATCH(request: NextRequest) {
  const { error, supabase, profile } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const { preferred_model, max_tokens_per_request, monthly_token_budget, features_enabled } = body;

  // Check if settings already exist
  const { data: existing } = await supabase
    .from('ai_settings')
    .select('id')
    .eq('tenant_id', profile.tenant_id)
    .single();

  let result;

  if (existing) {
    // Update existing settings
    const updates: Record<string, unknown> = {};
    if (preferred_model !== undefined) updates.preferred_model = preferred_model;
    if (max_tokens_per_request !== undefined) updates.max_tokens_per_request = max_tokens_per_request;
    if (monthly_token_budget !== undefined) updates.monthly_token_budget = monthly_token_budget;
    if (features_enabled !== undefined) updates.features_enabled = features_enabled;

    result = await supabase
      .from('ai_settings')
      .update(updates)
      .eq('id', existing.id)
      .select('*')
      .single();
  } else {
    // Create new settings
    result = await supabase
      .from('ai_settings')
      .insert({
        tenant_id: profile.tenant_id,
        preferred_model: preferred_model ?? 'claude-sonnet-4-20250514',
        max_tokens_per_request: max_tokens_per_request ?? 4096,
        monthly_token_budget: monthly_token_budget ?? 1000000,
        features_enabled: features_enabled ?? {
          chat: true,
          content_generation: true,
          insights: true,
          automations: false,
        },
      })
      .select('*')
      .single();
  }

  if (result.error) {
    return NextResponse.json(
      { success: false, error: { message: result.error.message } },
      { status: 500 }
    );
  }

  // Log activity
  await supabase.from('activity_logs').insert({
    tenant_id: profile.tenant_id,
    user_id: profile.id,
    action: 'settings.updated',
    resource_type: 'ai_settings',
    details: { updated_fields: Object.keys(body) },
  });

  return NextResponse.json({ success: true, data: result.data });
}
