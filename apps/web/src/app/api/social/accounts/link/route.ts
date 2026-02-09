import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import * as ayrshare from '@/lib/services/ayrshare';

/**
 * POST /api/social/accounts/link
 * Creates an Ayrshare profile (if needed) and generates a JWT link URL
 * for the user to connect their social media accounts.
 */
export async function POST(request: NextRequest) {
  const { error, supabase, profile } = await requireAuth();
  if (error) return error;

  if (!ayrshare.isConfigured()) {
    return NextResponse.json(
      { success: false, error: { message: 'Social media integration is not configured. Please set AYRSHARE_API_KEY.' } },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const redirectUrl = (body.redirectUrl as string) || `${process.env.NEXT_PUBLIC_SUPABASE_URL ? '' : ''}${request.nextUrl.origin}/api/social/accounts/callback`;

  try {
    // Check if tenant already has an Ayrshare profile
    const { data: existing } = await supabase
      .from('social_provider_profiles')
      .select('profile_key')
      .eq('tenant_id', profile.tenant_id)
      .eq('provider', 'ayrshare')
      .maybeSingle();

    let profileKey = existing?.profile_key;

    if (!profileKey) {
      // Create a new Ayrshare profile for this tenant
      const profileTitle = `ccd_${profile.tenant_id.replace(/-/g, '').slice(0, 16)}`;
      const createRes = await ayrshare.createProfile(profileTitle);

      if (createRes.status === 'error' || !createRes.profileKey) {
        return NextResponse.json(
          { success: false, error: { message: createRes.errors?.[0]?.message || 'Failed to create Ayrshare profile' } },
          { status: 500 }
        );
      }

      profileKey = createRes.profileKey;

      // Store the profile key
      await supabase.from('social_provider_profiles').insert({
        tenant_id: profile.tenant_id,
        provider: 'ayrshare',
        profile_key: profileKey,
        status: 'active',
        metadata: { title: profileTitle, ref_id: createRes.refId },
      });
    }

    // Generate JWT link URL for the user
    const jwtRes = await ayrshare.generateLinkUrl(profileKey, {
      redirectUrl,
    });

    if (!jwtRes.url) {
      return NextResponse.json(
        { success: false, error: { message: jwtRes.errors?.[0]?.message || 'Failed to generate link URL' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        url: jwtRes.url,
        profileKey,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err instanceof Error ? err.message : 'Failed to generate link' } },
      { status: 500 }
    );
  }
}
