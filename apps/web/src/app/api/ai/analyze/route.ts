import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';

const GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:4000';

export async function POST(request: NextRequest) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { data: { session } } = await supabase.auth.getSession();
  const body = await request.json();

  try {
    const res = await fetch(`${GATEWAY_URL}/ai/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'AI service unavailable. Please ensure the AI gateway is running.' } },
      { status: 503 }
    );
  }
}
