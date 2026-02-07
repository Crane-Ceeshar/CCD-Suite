import { NextResponse } from 'next/server';
import { createAdminServiceClient } from '@/lib/supabase/admin';

// Prevent Next.js from prerendering this route at build time
export const dynamic = 'force-dynamic';

// Public endpoint (for any authenticated user) — returns active announcements
export async function GET() {
  const serviceClient = createAdminServiceClient();
  const now = new Date().toISOString();

  const { data, error } = await serviceClient
    .from('system_announcements')
    .select('id, title, message, type, starts_at, ends_at')
    .eq('is_active', true)
    .lte('starts_at', now)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .order('type', { ascending: true }) // critical first
    .limit(5);

  if (error) {
    return NextResponse.json({ success: true, data: [] });
  }

  return NextResponse.json({ success: true, data: data ?? [] });
}
