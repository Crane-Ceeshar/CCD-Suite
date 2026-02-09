import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';

/** Reserved subdomains that cannot be used as organization slugs */
const RESERVED_SLUGS = [
  'www', 'api', 'app', 'admin', 'mail', 'smtp', 'ftp',
  'cdn', 'static', 'assets', 'portal', 'blog', 'docs',
  'help', 'support', 'status',
];

export async function GET(request: NextRequest) {
  const { error, supabase, profile } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const rawSlug = searchParams.get('slug');

  if (!rawSlug) {
    return NextResponse.json(
      { success: false, error: { message: 'slug parameter is required' } },
      { status: 400 }
    );
  }

  // Normalize the slug
  const slug = rawSlug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  if (!slug || slug.length < 2) {
    return NextResponse.json({
      success: true,
      data: { available: false, slug },
    });
  }

  // Check reserved subdomains
  if (RESERVED_SLUGS.includes(slug)) {
    return NextResponse.json({
      success: true,
      data: { available: false, slug },
    });
  }

  // Check existing tenants (excluding current tenant)
  const { data: existing } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .neq('id', profile.tenant_id)
    .maybeSingle();

  return NextResponse.json({
    success: true,
    data: { available: !existing, slug },
  });
}
