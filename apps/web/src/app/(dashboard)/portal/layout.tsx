'use client';

import { ModuleShell } from '@/components/layout/module-shell';
import { LayoutDashboard, FolderOpen } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/portal', icon: <LayoutDashboard /> },
  { label: 'Projects', href: '/portal/projects', icon: <FolderOpen /> },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleShell moduleId="client_portal" navItems={navItems}>
      {children}
    </ModuleShell>
  );
}
