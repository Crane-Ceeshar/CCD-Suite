import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/layout/admin-shell';
import { QueryProvider } from '@/providers/query-provider';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If not authenticated, render children directly (login page is the only
  // unauthenticated page that reaches here via middleware PUBLIC_ROUTES)
  if (!user) {
    return <>{children}</>;
  }

  // Fetch user profile with tenant info
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, tenants(*)')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/admin/login');
  }

  // Only admins can access the admin portal
  if (profile.user_type !== 'admin') {
    redirect('/admin/login');
  }

  return (
    <QueryProvider>
      <AdminShell user={profile} tenant={profile.tenants}>
        {children}
      </AdminShell>
    </QueryProvider>
  );
}
