'use client';

import { ModuleShell } from '@/components/layout/module-shell';
import { LayoutDashboard, GitBranch, Users, Building2, DollarSign } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/crm', icon: <LayoutDashboard /> },
  { label: 'Pipeline', href: '/crm/pipeline', icon: <GitBranch /> },
  { label: 'Contacts', href: '/crm/contacts', icon: <Users /> },
  { label: 'Companies', href: '/crm/companies', icon: <Building2 /> },
  { label: 'Deals', href: '/crm/deals', icon: <DollarSign /> },
];

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleShell moduleId="crm" navItems={navItems}>
      {children}
    </ModuleShell>
  );
}
