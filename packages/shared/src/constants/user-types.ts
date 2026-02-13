import type { PredefinedUserType, ModuleId } from '../types/auth.js';

export const USER_TYPE_MODULE_ACCESS: Record<PredefinedUserType, ModuleId[]> = {
  admin: [
    'crm', 'analytics', 'content', 'seo', 'social',
    'client_portal', 'projects', 'finance', 'hr', 'ai',
  ],
  owner: [
    'crm', 'analytics', 'content', 'seo', 'social',
    'client_portal', 'projects', 'finance', 'hr', 'ai',
  ],
  sales: ['crm', 'analytics', 'ai'],
  marketing: ['content', 'seo', 'social', 'analytics', 'ai'],
  project_manager: ['projects', 'analytics', 'ai'],
  finance: ['finance', 'analytics', 'ai'],
  hr: ['hr', 'analytics', 'ai'],
  client: ['client_portal'],
};

export const USER_TYPE_LABELS: Record<PredefinedUserType, string> = {
  admin: 'Admin',
  owner: 'Owner',
  sales: 'Sales',
  marketing: 'Marketing',
  project_manager: 'Project Manager',
  finance: 'Finance',
  hr: 'HR',
  client: 'Client',
};

/**
 * Get allowed modules for a user type.
 * Supports both predefined types and custom types (via customModules param).
 */
export function getModulesForUserType(
  userType: string,
  customModules?: ModuleId[],
): ModuleId[] {
  if (customModules && customModules.length > 0) {
    return customModules;
  }
  return USER_TYPE_MODULE_ACCESS[userType as PredefinedUserType] ?? [];
}

/**
 * Check if a user type has access to a specific module.
 */
export function hasModuleAccess(
  userType: string,
  moduleId: ModuleId,
  customModules?: ModuleId[],
): boolean {
  const modules = getModulesForUserType(userType, customModules);
  return modules.includes(moduleId);
}

export const PREDEFINED_USER_TYPES: PredefinedUserType[] = [
  'admin', 'owner', 'sales', 'marketing', 'project_manager',
  'finance', 'hr', 'client',
];
