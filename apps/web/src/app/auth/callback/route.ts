import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // OAuth error from provider
  if (error) {
    const msg = errorDescription || error;
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(msg)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = await createClient();

  // Exchange the code for a session
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`
    );
  }

  // Get the authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  // Check if user has a profile (sign-in only guard for Google OAuth).
  // If someone tries to sign in with Google but never registered via the
  // signup form, they won't have a profile row. Sign them out and reject.
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!profile) {
    // New Google user with no account — sign them out and redirect with error
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=no_account`);
  }

  // Success — redirect to dashboard
  return NextResponse.redirect(`${origin}/dashboard`);
}
