'use client';

import { ModuleShell } from '@/components/layout/module-shell';
import { LayoutDashboard, Kanban, List, GanttChart } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/projects', icon: <LayoutDashboard /> },
  { label: 'Board', href: '/projects/board', icon: <Kanban /> },
  { label: 'List', href: '/projects/list', icon: <List /> },
  { label: 'Timeline', href: '/projects/timeline', icon: <GanttChart /> },
];

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleShell moduleId="projects" navItems={navItems}>
      {children}
    </ModuleShell>
  );
}
