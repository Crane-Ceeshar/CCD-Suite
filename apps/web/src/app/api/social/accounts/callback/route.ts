import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import * as ayrshare from '@/lib/services/ayrshare';

/**
 * GET /api/social/accounts/callback
 * Handles the redirect after the user completes Ayrshare social account linking.
 * Syncs connected platforms into social_accounts table.
 */
export async function GET(request: NextRequest) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) {
    // Redirect to accounts page with error
    return NextResponse.redirect(new URL('/social/accounts?error=auth', request.url));
  }

  try {
    // Get the Ayrshare profile key for this tenant
    const { data: provider } = await supabase
      .from('social_provider_profiles')
      .select('profile_key')
      .eq('tenant_id', profile.tenant_id)
      .eq('provider', 'ayrshare')
      .eq('status', 'active')
      .single();

    if (!provider?.profile_key) {
      return NextResponse.redirect(new URL('/social/accounts?error=no_profile', request.url));
    }

    // Query Ayrshare for connected platforms
    const profileData = await ayrshare.getProfile(provider.profile_key);
    const activePlatforms = profileData.activeSocialAccounts ?? [];
    const displayNames = profileData.displayNames ?? {};

    // Supported platforms in CCD Suite
    const supportedPlatforms = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube'];

    // Sync each connected platform into social_accounts
    for (const platform of activePlatforms) {
      if (!supportedPlatforms.includes(platform)) continue;

      const displayName = displayNames[platform] || platform;

      // Check if this platform account already exists for this tenant
      const { data: existingAccount } = await supabase
        .from('social_accounts')
        .select('id')
        .eq('tenant_id', profile.tenant_id)
        .eq('platform', platform)
        .maybeSingle();

      if (existingAccount) {
        // Update existing account to active
        await supabase.from('social_accounts').update({
          account_name: displayName,
          status: 'active',
          access_token_encrypted: provider.profile_key,
          metadata: {
            connection_type: 'ayrshare',
            ayrshare_profile_key: provider.profile_key,
            display_name: displayName,
          },
        }).eq('id', existingAccount.id);
      } else {
        // Create new account entry
        await supabase.from('social_accounts').insert({
          tenant_id: profile.tenant_id,
          platform,
          account_name: displayName,
          account_id: null,
          avatar_url: null,
          access_token_encrypted: provider.profile_key,
          status: 'active',
          metadata: {
            connection_type: 'ayrshare',
            ayrshare_profile_key: provider.profile_key,
            display_name: displayName,
          },
          connected_by: user.id,
        });
      }
    }

    // Redirect back to accounts page
    const connectedCount = activePlatforms.filter((p) => supportedPlatforms.includes(p)).length;
    return NextResponse.redirect(
      new URL(`/social/accounts?connected=${connectedCount}`, request.url)
    );
  } catch (err) {
    console.error('Ayrshare callback error:', err);
    return NextResponse.redirect(new URL('/social/accounts?error=sync_failed', request.url));
  }
}
