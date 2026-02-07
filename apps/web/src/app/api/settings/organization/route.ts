import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';

export async function GET() {
  const { error, supabase, profile } = await requireAuth();
  if (error) return error;

  const { data, error: queryError } = await supabase
    .from('tenants')
    .select('id, name, slug, logo_url, plan, settings')
    .eq('id', profile.tenant_id)
    .single();

  if (queryError) {
    return NextResponse.json(
      { success: false, error: { message: queryError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}

export async function PATCH(request: NextRequest) {
  const { error, supabase, profile } = await requireAuth();
  if (error) return error;

  const body = await request.json();

  // Build update object from allowed fields
  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.logo_url !== undefined) updates.logo_url = body.logo_url;

  // If name changed, generate new slug and validate uniqueness
  if (body.name !== undefined) {
    const slug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    if (!slug || slug.length < 2) {
      return NextResponse.json(
        { success: false, error: { message: 'Organization name is too short' } },
        { status: 400 }
      );
    }

    // Reserved subdomains
    const reserved = ['www', 'api', 'app', 'admin', 'mail', 'smtp', 'ftp', 'cdn', 'static', 'assets', 'portal', 'blog', 'docs', 'help', 'support', 'status'];
    if (reserved.includes(slug)) {
      return NextResponse.json(
        { success: false, error: { message: 'This organization name is reserved. Please choose a different name.' } },
        { status: 400 }
      );
    }

    // Check uniqueness (exclude current tenant)
    const { data: existing } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .neq('id', profile.tenant_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { success: false, error: { message: 'An organization with this name already exists. Please choose a different name.' } },
        { status: 409 }
      );
    }

    updates.slug = slug;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { success: false, error: { message: 'No fields to update' } },
      { status: 400 }
    );
  }

  const { data, error: updateError } = await supabase
    .from('tenants')
    .update(updates)
    .eq('id', profile.tenant_id)
    .select('id, name, slug, logo_url, plan, settings')
    .single();

  if (updateError) {
    return NextResponse.json(
      { success: false, error: { message: updateError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}
