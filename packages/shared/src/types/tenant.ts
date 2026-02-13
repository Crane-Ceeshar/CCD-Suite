import type { ModuleId } from './auth.js';

export type PlanTier = 'starter' | 'professional' | 'enterprise' | 'custom';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: PlanTier;
  logo_url: string | null;
  settings: TenantSettings;
  max_users: number;
  is_active: boolean;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenantSettings {
  modules_enabled: ModuleId[];
  features: Record<string, boolean>;
  brand_color?: string;
  custom_domain?: string;
}
