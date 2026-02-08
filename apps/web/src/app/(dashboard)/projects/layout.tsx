'use client';

import { ModuleShell } from '@/components/layout/module-shell';
import { LayoutDashboard, Kanban, List, GanttChart, Clock, Zap } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/projects', icon: <LayoutDashboard /> },
  { label: 'Board', href: '/projects/board', icon: <Kanban /> },
  { label: 'List', href: '/projects/list', icon: <List /> },
  { label: 'Timeline', href: '/projects/timeline', icon: <GanttChart /> },
  { label: 'Time Tracking', href: '/projects/time-tracking', icon: <Clock /> },
  { label: 'Sprints', href: '/projects/sprints', icon: <Zap /> },
];

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleShell moduleId="projects" navItems={navItems} settingsHref="/projects/settings">
      {children}
    </ModuleShell>
  );
}
