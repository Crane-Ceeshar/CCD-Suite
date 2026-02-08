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
  | 'settings.updated'
  | 'settings.exported'
  | 'settings.imported'
  | 'webhook.created'
  | 'webhook.updated'
  | 'webhook.deleted'
  | 'webhook.tested'
  | 'custom_field.created'
  | 'custom_field.updated'
  | 'custom_field.deleted';

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

// ============================================================
// Webhook Types
// ============================================================

export interface Webhook {
  id: string;
  tenant_id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  is_active: boolean;
  last_triggered_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const WEBHOOK_EVENT_GROUPS: Record<string, string[]> = {
  crm: [
    'contact.created', 'contact.updated', 'contact.deleted',
    'company.created', 'company.updated',
    'deal.created', 'deal.updated', 'deal.won', 'deal.lost',
  ],
  projects: [
    'task.created', 'task.completed', 'task.assigned',
    'sprint.started', 'sprint.completed',
  ],
  finance: [
    'invoice.created', 'invoice.paid',
    'expense.created', 'payment.received',
  ],
  hr: [
    'employee.created', 'leave.requested', 'leave.approved',
  ],
  content: [
    'content.published', 'content.updated', 'content.archived',
  ],
};

// ============================================================
// Custom Field Types
// ============================================================

export type CustomFieldType = 'text' | 'number' | 'date' | 'select' | 'boolean' | 'url' | 'email';

export interface CustomFieldDefinition {
  id: string;
  tenant_id: string;
  module: string;
  entity_type: string;
  field_name: string;
  field_label: string;
  field_type: CustomFieldType;
  options: unknown[];
  is_required: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const CUSTOM_FIELD_ENTITIES: Record<
  string,
  { label: string; entities: { value: string; label: string }[] }
> = {
  crm: {
    label: 'CRM',
    entities: [
      { value: 'contacts', label: 'Contacts' },
      { value: 'companies', label: 'Companies' },
      { value: 'deals', label: 'Deals' },
    ],
  },
  projects: {
    label: 'Projects',
    entities: [{ value: 'tasks', label: 'Tasks' }],
  },
  hr: {
    label: 'HR',
    entities: [{ value: 'employees', label: 'Employees' }],
  },
  finance: {
    label: 'Finance',
    entities: [{ value: 'invoices', label: 'Invoices' }],
  },
};

// ============================================================
// Settings Export/Import Types
// ============================================================

export interface SettingsExportData {
  version: string;
  exported_at: string;
  tenant_id: string;
  settings: Record<string, unknown>;
}
