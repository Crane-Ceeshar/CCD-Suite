import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { requireTenantAdmin } from '@/lib/supabase/tenant-admin';
import { USER_TYPE_MODULE_ACCESS, USER_TYPE_LABELS } from '@ccd/shared';
import type { PredefinedUserType } from '@ccd/shared';

export async function GET() {
  const { error, supabase, profile } = await requireAuth();
  if (error) return error;

  // Fetch custom roles from user_type_definitions
  const { data: customRoles, error: queryError } = await supabase
    .from('user_type_definitions')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { ascending: true });

  if (queryError) {
    return NextResponse.json(
      { success: false, error: { message: queryError.message } },
      { status: 500 }
    );
  }

  // Build predefined roles list (exclude admin — that's platform-only)
  const predefinedRoles = Object.entries(USER_TYPE_LABELS)
    .filter(([slug]) => slug !== 'admin')
    .map(([slug, name]) => ({
      id: `predefined_${slug}`,
      slug,
      name,
      description: null,
      modules: USER_TYPE_MODULE_ACCESS[slug as PredefinedUserType] ?? [],
      is_system: true,
      is_predefined: true,
    }));

  return NextResponse.json({
    success: true,
    data: {
      predefined: predefinedRoles,
      custom: customRoles ?? [],
    },
  });
}

export async function POST(request: NextRequest) {
  const { error, supabase, profile } = await requireTenantAdmin();
  if (error) return error;

  const body = await request.json();
  const { name, description, modules } = body;

  if (!name || !modules || !Array.isArray(modules)) {
    return NextResponse.json(
      { success: false, error: { message: 'name and modules are required' } },
      { status: 400 }
    );
  }

  // Generate slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  if (!slug || slug.length < 2) {
    return NextResponse.json(
      { success: false, error: { message: 'Role name is too short' } },
      { status: 400 }
    );
  }

  // Check for slug collision with predefined types
  const predefinedSlugs = Object.keys(USER_TYPE_LABELS);
  if (predefinedSlugs.includes(slug)) {
    return NextResponse.json(
      { success: false, error: { message: 'This role name conflicts with a system role' } },
      { status: 409 }
    );
  }

  const { data, error: insertError } = await supabase
    .from('user_type_definitions')
    .insert({
      tenant_id: profile.tenant_id,
      name,
      slug,
      description: description || null,
      modules,
      is_system: false,
    })
    .select()
    .single();

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json(
        { success: false, error: { message: 'A role with this name already exists' } },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: { message: insertError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}
