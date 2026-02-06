'use client';

import { ModuleShell } from '@/components/layout/module-shell';
import { LayoutDashboard, MessageSquare, Wand2, Lightbulb, Zap } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/ai', icon: <LayoutDashboard /> },
  { label: 'Assistant', href: '/ai/assistant', icon: <MessageSquare /> },
  { label: 'Content Generator', href: '/ai/content-generator', icon: <Wand2 /> },
  { label: 'Insights', href: '/ai/insights', icon: <Lightbulb /> },
  { label: 'Automations', href: '/ai/automations', icon: <Zap /> },
];

export default function AILayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleShell moduleId="ai" navItems={navItems}>
      {children}
    </ModuleShell>
  );
}
