import type { PlanTier } from '../types/tenant';

export interface PlanFeatures {
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  limits: {
    maxUsers: number;
    maxModules: number;
    maxStorageGb: number;
  };
  features: string[];
  highlighted: boolean;
}

export const PLAN_FEATURES: Record<Exclude<PlanTier, 'custom'>, PlanFeatures> = {
  starter: {
    name: 'Starter',
    description: 'Perfect for small teams getting started',
    monthlyPrice: 29,
    annualPrice: 290,
    limits: {
      maxUsers: 5,
      maxModules: 5,
      maxStorageGb: 5,
    },
    features: [
      'Up to 5 team members',
      'Up to 5 modules',
      '5 GB storage',
      'CRM with contacts & deals',
      'Basic project management',
      'Email support',
      'Standard analytics',
      'CSV import/export',
    ],
    highlighted: false,
  },
  professional: {
    name: 'Professional',
    description: 'For growing teams that need more power',
    monthlyPrice: 79,
    annualPrice: 790,
    limits: {
      maxUsers: 25,
      maxModules: 9,
      maxStorageGb: 50,
    },
    features: [
      'Up to 25 team members',
      'Up to 9 modules',
      '50 GB storage',
      'Everything in Starter',
      'Advanced CRM pipeline',
      'Content management',
      'Finance & invoicing',
      'HR management',
      'Priority email support',
      'Advanced analytics & reports',
      'Custom roles & permissions',
      'Audit log',
    ],
    highlighted: true,
  },
  enterprise: {
    name: 'Enterprise',
    description: 'For large organizations with advanced needs',
    monthlyPrice: 199,
    annualPrice: 1990,
    limits: {
      maxUsers: -1, // unlimited
      maxModules: 11,
      maxStorageGb: 500,
    },
    features: [
      'Unlimited team members',
      'All 11 modules',
      '500 GB storage',
      'Everything in Professional',
      'Webhooks & integrations',
      'Custom fields',
      'White-label branding',
      'Data retention policies',
      'SSO / SAML authentication',
      'Custom domain',
      'Dedicated account manager',
      'Phone & chat support',
      'SLA guarantee',
    ],
    highlighted: false,
  },
};

export const ENTERPRISE_ONLY_SETTINGS = [
  '/settings/integrations',
  '/settings/webhooks',
  '/settings/branding',
  '/settings/data-retention',
];

export const PLAN_TIER_ORDER: Record<PlanTier, number> = {
  starter: 0,
  professional: 1,
  enterprise: 2,
  custom: 3,
};
