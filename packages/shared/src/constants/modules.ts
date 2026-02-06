import type { ModuleId } from '../types/auth';

export interface ModuleDefinition {
  id: ModuleId;
  name: string;
  description: string;
  color: string;
  /** Lucide icon name */
  icon: string;
  basePath: string;
  /** Which development phase this module is built in */
  phase: number;
}

export const MODULES: Record<ModuleId, ModuleDefinition> = {
  crm: {
    id: 'crm',
    name: 'CRM',
    description: 'Client relationships, sales pipeline, and deal management',
    color: '#0047AB',
    icon: 'users',
    basePath: '/crm',
    phase: 2,
  },
  analytics: {
    id: 'analytics',
    name: 'Analytics',
    description: 'Cross-platform performance tracking and insights',
    color: '#8B5CF6',
    icon: 'bar-chart-3',
    basePath: '/analytics',
    phase: 2,
  },
  content: {
    id: 'content',
    name: 'Content',
    description: 'Content planning, creation, and scheduling',
    color: '#EC4899',
    icon: 'pen-tool',
    basePath: '/content',
    phase: 2,
  },
  seo: {
    id: 'seo',
    name: 'SEO',
    description: 'Website optimisation and digital presence management',
    color: '#9BBD2B',
    icon: 'search',
    basePath: '/seo',
    phase: 3,
  },
  social: {
    id: 'social',
    name: 'Social Media',
    description: 'Social account management and engagement',
    color: '#F59E0B',
    icon: 'share-2',
    basePath: '/social',
    phase: 3,
  },
  client_portal: {
    id: 'client_portal',
    name: 'Client Portal',
    description: 'External client collaboration and communication',
    color: '#06B6D4',
    icon: 'layout-grid',
    basePath: '/portal',
    phase: 3,
  },
  projects: {
    id: 'projects',
    name: 'Projects',
    description: 'Task management, workflows, and team coordination',
    color: '#6366F1',
    icon: 'folder-kanban',
    basePath: '/projects',
    phase: 2,
  },
  finance: {
    id: 'finance',
    name: 'Finance',
    description: 'Invoicing, expenses, and financial tracking',
    color: '#14B8A6',
    icon: 'wallet',
    basePath: '/finance',
    phase: 3,
  },
  hr: {
    id: 'hr',
    name: 'HR',
    description: 'Employee management, payroll, and compliance',
    color: '#F97316',
    icon: 'building-2',
    basePath: '/hr',
    phase: 3,
  },
  ai: {
    id: 'ai',
    name: 'AI Assistant',
    description: 'AI-powered insights, content generation, and smart automations',
    color: '#10B981',
    icon: 'sparkles',
    basePath: '/ai',
    phase: 4,
  },
};

export const MODULE_LIST = Object.values(MODULES);

export function getModuleById(id: ModuleId): ModuleDefinition {
  return MODULES[id];
}
