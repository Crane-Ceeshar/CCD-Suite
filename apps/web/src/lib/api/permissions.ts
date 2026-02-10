import { SupabaseClient } from '@supabase/supabase-js';
import { error } from './responses';

const ROLE_HIERARCHY: Record<string, number> = {
  writer: 1,
  editor: 2,
  reviewer: 3,
  publisher: 4,
  admin: 5,
};

export type ContentRole = 'writer' | 'editor' | 'reviewer' | 'publisher' | 'admin';

/**
 * Check if a user has a content role >= the required level.
 * Falls back to profile.user_type: admin/owner maps to 'admin'.
 */
export async function checkContentPermission(
  supabase: SupabaseClient,
  userId: string,
  tenantId: string,
  requiredRole: ContentRole
): Promise<{ allowed: boolean; role: ContentRole | null; error?: ReturnType<typeof error> }> {
  // 1. Check content_roles table for explicit role
  const { data: roleData } = await supabase
    .from('content_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .single();

  let userRole = roleData?.role as ContentRole | null;

  // 2. Fallback: map profile.user_type to a content role
  //    admin/owner → admin, others → writer (baseline access)
  if (!userRole) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', userId)
      .single();

    if (profile?.user_type) {
      const typeToRole: Record<string, ContentRole> = {
        admin: 'admin',
        owner: 'admin',
      };
      userRole = typeToRole[profile.user_type] ?? 'writer';
    }
  }

  if (userRole && ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]) {
    return { allowed: true, role: userRole };
  }

  return {
    allowed: false,
    role: userRole,
    error: error(`Insufficient permissions. Required: ${requiredRole}`, 403),
  };
}
