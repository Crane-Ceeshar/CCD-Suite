import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { isAdminSubdomain } from '@/lib/admin-subdomain';
import { AdminShell } from '@/components/layout/admin-shell';
import { QueryProvider } from '@/providers/query-provider';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const hostname = headersList.get('host') || '';
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'ccdsuite.com';
  const onAdminSubdomain = isAdminSubdomain(hostname, baseDomain);
  const loginPath = onAdminSubdomain ? '/login' : '/admin/login';

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
    redirect(loginPath);
  }

  // Only admins can access the admin portal
  if (profile.user_type !== 'admin') {
    redirect(loginPath);
  }

  return (
    <QueryProvider>
      <AdminShell user={profile} tenant={profile.tenants}>
        {children}
      </AdminShell>
    </QueryProvider>
  );
}
