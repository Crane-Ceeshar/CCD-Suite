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
    description: 'Perfect for small agencies getting started.',
    monthlyPrice: 29,
    annualPrice: 290,
    limits: {
      maxUsers: 5,
      maxModules: 3,
      maxStorageGb: 5,
    },
    features: [
      'Up to 5 team members',
      'Choose any 3 modules',
      '1,000 contacts',
      '5 GB storage',
      'Email support',
      'Basic analytics',
    ],
    highlighted: false,
  },
  professional: {
    name: 'Professional',
    description: 'For growing agencies that need the full suite.',
    monthlyPrice: 59,
    annualPrice: 590,
    limits: {
      maxUsers: 25,
      maxModules: 9,
      maxStorageGb: 50,
    },
    features: [
      'Up to 25 team members',
      'All 9 modules included',
      '10,000 contacts',
      '50 GB storage',
      'Priority support',
      'Advanced analytics & AI',
      'Client portal access',
      'Custom branding',
    ],
    highlighted: true,
  },
  enterprise: {
    name: 'Enterprise',
    description: 'For large agencies with advanced needs.',
    monthlyPrice: 99,
    annualPrice: 990,
    limits: {
      maxUsers: -1, // unlimited
      maxModules: 11,
      maxStorageGb: 500,
    },
    features: [
      'Everything in Professional',
      'Unlimited team members',
      'All 9 modules + custom modules',
      'Unlimited contacts',
      '500 GB storage',
      'Webhooks & integrations',
      'Custom fields',
      'White-label branding',
      'Data retention policies',
      'SSO / SAML authentication',
      'Dedicated account manager',
      'Full AI suite with custom models',
      'API access & webhooks',
    ],
    highlighted: false,
  },
};

export const ENTERPRISE_ONLY_SETTINGS = [
  '/settings/integrations',
  '/settings/webhooks',
  '/settings/branding',
  '/settings/data-retention',
  '/settings/custom-fields',
];

export const PLAN_TIER_ORDER: Record<PlanTier, number> = {
  starter: 0,
  professional: 1,
  enterprise: 2,
  custom: 3,
};
