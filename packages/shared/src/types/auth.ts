export type ModuleId =
  | 'crm'
  | 'analytics'
  | 'content'
  | 'seo'
  | 'social'
  | 'client_portal'
  | 'projects'
  | 'finance'
  | 'hr'
  | 'ai';

export type PredefinedUserType =
  | 'admin'
  | 'sales'
  | 'marketing'
  | 'project_manager'
  | 'finance'
  | 'hr'
  | 'client';

/** User type can be predefined or a custom slug */
export type UserType = PredefinedUserType | string;

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  user_type: UserType;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  user: User;
  tenant: import('./tenant').Tenant;
  modules: ModuleId[];
  expires_at: number;
}

export interface UserTypeDefinition {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description: string | null;
  modules: ModuleId[];
  is_system: boolean;
  created_at: string;
}
