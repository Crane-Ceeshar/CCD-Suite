'use client';

import { ModuleShell } from '@/components/layout/module-shell';
import { LayoutDashboard, FileBarChart } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/analytics', icon: <LayoutDashboard /> },
  { label: 'Reports', href: '/analytics/reports', icon: <FileBarChart /> },
];

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleShell moduleId="analytics" navItems={navItems}>
      {children}
    </ModuleShell>
  );
}
