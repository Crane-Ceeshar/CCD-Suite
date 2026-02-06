import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/layout/admin-shell';

export default async function AdminLayout({
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

  // Only admins can access the admin portal
  if (profile.user_type !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <AdminShell user={profile} tenant={profile.tenants}>
      {children}
    </AdminShell>
  );
}
