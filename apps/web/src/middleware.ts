import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Module access control mapping (mirrors @ccd/shared/constants/user-types)
const USER_TYPE_MODULE_ACCESS: Record<string, string[]> = {
  admin: ['crm', 'analytics', 'content', 'seo', 'social', 'client_portal', 'projects', 'finance', 'hr', 'ai'],
  sales: ['crm', 'analytics', 'ai'],
  marketing: ['content', 'seo', 'social', 'analytics', 'ai'],
  project_manager: ['projects', 'analytics', 'ai'],
  finance: ['finance', 'analytics', 'ai'],
  hr: ['hr', 'analytics', 'ai'],
  client: ['client_portal'],
};

// Module routes mapped from base paths (admin is handled separately)
const MODULE_ROUTES: Record<string, string> = {
  '/crm': 'crm',
  '/analytics': 'analytics',
  '/content': 'content',
  '/seo': 'seo',
  '/social': 'social',
  '/portal': 'client_portal',
  '/projects': 'projects',
  '/finance': 'finance',
  '/hr': 'hr',
  '/ai': 'ai',
};

const PUBLIC_ROUTES = ['/', '/login', '/register', '/forgot-password', '/auth/callback'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public routes
  if (PUBLIC_ROUTES.some((route) => pathname === route || (route !== '/' && pathname.startsWith(route)))) {
    const { response } = await updateSession(request);
    return response;
  }

  // Refresh session and get user
  const { user, response, supabase } = await updateSession(request);

  // Redirect unauthenticated users to login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Admin portal: only admin user_type can access
  if (pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (!profile || profile.user_type !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
    return response;
  }

  // Dashboard is accessible to all authenticated users
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/settings')) {
    return response;
  }

  // Check module access for module routes
  const moduleRoute = Object.entries(MODULE_ROUTES).find(([route]) =>
    pathname.startsWith(route)
  );

  if (moduleRoute) {
    const [, moduleId] = moduleRoute;

    // Get user profile for user_type
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (profile) {
      const allowedModules = USER_TYPE_MODULE_ACCESS[profile.user_type] ?? [];
      if (!allowedModules.includes(moduleId)) {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
