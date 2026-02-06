'use client';

import { ModuleShell } from '@/components/layout/module-shell';
import { LayoutDashboard, FolderSearch, Key, ClipboardCheck } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/seo', icon: <LayoutDashboard /> },
  { label: 'Projects', href: '/seo/projects', icon: <FolderSearch /> },
  { label: 'Keywords', href: '/seo/keywords', icon: <Key /> },
  { label: 'Audits', href: '/seo/audits', icon: <ClipboardCheck /> },
];

export default function SEOLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleShell moduleId="seo" navItems={navItems}>
      {children}
    </ModuleShell>
  );
}
