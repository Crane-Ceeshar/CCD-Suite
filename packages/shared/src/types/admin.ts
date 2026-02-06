// ============================================================
// Admin Module Types
// ============================================================

export type ActivityAction =
  | 'user.login'
  | 'user.logout'
  | 'user.created'
  | 'user.updated'
  | 'user.deactivated'
  | 'tenant.updated'
  | 'module.enabled'
  | 'module.disabled'
  | 'api_key.created'
  | 'api_key.rotated'
  | 'api_key.deleted'
  | 'settings.updated';

export interface ActivityLog {
  id: string;
  tenant_id: string;
  user_id: string | null;
  action: ActivityAction;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export interface SystemSetting {
  id: string;
  tenant_id: string;
  key: string;
  value: unknown;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiKeyRecord {
  id: string;
  tenant_id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  scopes: string[];
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceHealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  latency_ms: number | null;
  last_checked: string;
  details?: Record<string, unknown>;
}

export interface AdminDashboardStats {
  total_users: number;
  active_users: number;
  total_modules_enabled: number;
  recent_activity_count: number;
}

export interface CreateApiKeyInput {
  name: string;
  scopes: string[];
  expires_at?: string;
}

export interface UpdateUserInput {
  full_name?: string;
  user_type?: string;
  is_active?: boolean;
}

export interface InviteUserInput {
  email: string;
  full_name: string;
  user_type: string;
}
