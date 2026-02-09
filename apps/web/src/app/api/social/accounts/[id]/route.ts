import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import * as ayrshare from '@/lib/services/ayrshare';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { data, error: queryError } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('id', id)
    .single();

  if (queryError) {
    return NextResponse.json(
      { success: false, error: { message: queryError.message } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();

  const { data, error: updateError } = await supabase
    .from('social_accounts')
    .update({
      ...(body.account_name !== undefined && { account_name: body.account_name }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.avatar_url !== undefined && { avatar_url: body.avatar_url }),
      ...(body.metadata !== undefined && { metadata: body.metadata }),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (updateError) {
    return NextResponse.json(
      { success: false, error: { message: updateError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  // Try to unlink from Ayrshare if this was an OAuth-connected account
  const { data: account } = await supabase
    .from('social_accounts')
    .select('access_token_encrypted')
    .eq('id', id)
    .single();

  if (account?.access_token_encrypted && ayrshare.isConfigured()) {
    try {
      await ayrshare.deleteProfile(account.access_token_encrypted);
    } catch {
      // Continue with DB delete even if Ayrshare unlink fails
    }
  }

  const { error: deleteError } = await supabase
    .from('social_accounts')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return NextResponse.json(
      { success: false, error: { message: deleteError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: null });
}
