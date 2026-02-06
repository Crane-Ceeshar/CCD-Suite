import { redirect } from 'next/navigation';
import { LandingPage } from '@/components/landing/landing-page';

export default async function RootPage() {
  // Show landing page if Supabase is not configured yet
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return <LandingPage />;
  }

  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      redirect('/dashboard');
    }
  } catch {
    // If auth check fails, fall through to landing page
  }

  return <LandingPage />;
}
