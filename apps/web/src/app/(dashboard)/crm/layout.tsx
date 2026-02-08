'use client';

import { ModuleShell } from '@/components/layout/module-shell';
import { AskAiButton } from '@/components/ai/ask-ai-button';
import { CrmSettingsDialog } from '@/components/crm/crm-settings-dialog';
import {
  LayoutDashboard,
  DollarSign,
  UserCheck,
  Users,
  Building2,
  FolderKanban,
  Package,
  Activity,
  GitBranch,
} from 'lucide-react';

const navItems = [
  { label: 'Sales Dashboard', href: '/crm', icon: <LayoutDashboard /> },
  { label: 'Deals', href: '/crm/deals', icon: <DollarSign /> },
  { label: 'Leads', href: '/crm/leads', icon: <UserCheck /> },
  { label: 'Contacts', href: '/crm/contacts', icon: <Users /> },
  { label: 'Accounts', href: '/crm/companies', icon: <Building2 /> },
  { label: 'Pipeline', href: '/crm/pipeline', icon: <GitBranch /> },
  { label: 'Client Projects', href: '/crm/projects', icon: <FolderKanban /> },
  { label: 'Products & Services', href: '/crm/products', icon: <Package /> },
  { label: 'Activities', href: '/crm/activities', icon: <Activity /> },
];

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleShell
      moduleId="crm"
      navItems={navItems}
      renderSettings={({ open, onOpenChange }) => (
        <CrmSettingsDialog open={open} onOpenChange={onOpenChange} />
      )}
    >
      {children}
      <AskAiButton moduleContext="crm" />
    </ModuleShell>
  );
}
