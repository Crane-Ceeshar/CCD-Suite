import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, createAdminServiceClient } from '@/lib/supabase/admin';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const serviceClient = createAdminServiceClient();

  // Get all tenants
  const { data: tenants, error: queryError } = await serviceClient
    .from('tenants')
    .select('id, name, slug, plan, is_active, max_users, trial_ends_at, settings, created_at')
    .order('created_at', { ascending: false });

  if (queryError) {
    return NextResponse.json(
      { success: false, error: { message: queryError.message } },
      { status: 500 }
    );
  }

  // Batch-fetch user counts per tenant
  const { data: profiles } = await serviceClient
    .from('profiles')
    .select('tenant_id');

  const userCounts: Record<string, number> = {};
  if (profiles) {
    for (const p of profiles) {
      userCounts[p.tenant_id] = (userCounts[p.tenant_id] || 0) + 1;
    }
  }

  const enrichedTenants = (tenants ?? []).map((t) => ({
    ...t,
    user_count: userCounts[t.id] || 0,
  }));

  return NextResponse.json({ success: true, data: enrichedTenants });
}

export async function POST(request: NextRequest) {
  const { error, profile } = await requireAdmin();
  if (error) return error;

  const serviceClient = createAdminServiceClient();
  const body = await request.json();
  const { name, slug, plan } = body;

  if (!name || !slug) {
    return NextResponse.json(
      { success: false, error: { message: 'Name and slug are required' } },
      { status: 400 }
    );
  }

  const { data: tenant, error: insertError } = await serviceClient
    .from('tenants')
    .insert({
      name,
      slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      plan: plan || 'starter',
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json(
      { success: false, error: { message: insertError.message } },
      { status: 500 }
    );
  }

  // Log activity
  await serviceClient.from('activity_logs').insert({
    tenant_id: profile.tenant_id,
    user_id: profile.id,
    action: 'tenant.created',
    resource_type: 'tenant',
    resource_id: tenant.id,
    details: { name, slug, plan },
  });

  return NextResponse.json({ success: true, data: tenant }, { status: 201 });
}
