import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user profile with tenant info
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, tenants(*)')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  return (
    <DashboardShell user={profile} tenant={profile.tenants}>
      {children}
    </DashboardShell>
  );
}
