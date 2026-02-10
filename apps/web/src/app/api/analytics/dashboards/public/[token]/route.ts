import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/analytics/dashboards/public/:token
 * Fetch a publicly shared dashboard by share token. No auth required.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { success: false, error: { message: 'Server configuration error' } },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Fetch the dashboard by share token
  const { data: dashboard, error: dashboardError } = await supabase
    .from('dashboards')
    .select('*')
    .eq('share_token', token)
    .eq('is_public', true)
    .single();

  if (dashboardError || !dashboard) {
    return NextResponse.json(
      { success: false, error: { message: 'Dashboard not found or not public' } },
      { status: 404 }
    );
  }

  // Fetch widgets for the dashboard
  const { data: widgets } = await supabase
    .from('widgets')
    .select('*')
    .eq('dashboard_id', dashboard.id)
    .order('created_at', { ascending: true });

  const response = NextResponse.json({
    success: true,
    data: {
      ...dashboard,
      widgets: widgets ?? [],
    },
  });

  response.headers.set('Cache-Control', 'public, max-age=300');
  return response;
}
