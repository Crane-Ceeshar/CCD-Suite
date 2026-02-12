'use client';

import { ModuleShell } from '@/components/layout/module-shell';
import { LayoutDashboard, MessageSquare, Wand2, BookOpen, Lightbulb, Zap, Database } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/ai', icon: <LayoutDashboard /> },
  { label: 'Assistant', href: '/ai/assistant', icon: <MessageSquare /> },
  { label: 'Content Generator', href: '/ai/content-generator', icon: <Wand2 /> },
  { label: 'Library', href: '/ai/library', icon: <BookOpen /> },
  { label: 'Insights', href: '/ai/insights', icon: <Lightbulb /> },
  { label: 'Automations', href: '/ai/automations', icon: <Zap /> },
  { label: 'Knowledge Base', href: '/ai/knowledge-base', icon: <Database /> },
];

export default function AILayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleShell moduleId="ai" navItems={navItems}>
      {children}
    </ModuleShell>
  );
}
