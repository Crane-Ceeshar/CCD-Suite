'use client';

import { ModuleShell } from '@/components/layout/module-shell';
import { LayoutDashboard, FileBarChart, BarChart3, Database } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/analytics', icon: <LayoutDashboard /> },
  { label: 'Reports', href: '/analytics/reports', icon: <FileBarChart /> },
  { label: 'Custom Dashboards', href: '/analytics/dashboards', icon: <BarChart3 /> },
  { label: 'Data Sources', href: '/analytics/sources', icon: <Database /> },
];

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleShell moduleId="analytics" navItems={navItems} settingsHref="/analytics/settings">
      {children}
    </ModuleShell>
  );
}
