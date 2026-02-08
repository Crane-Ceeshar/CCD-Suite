'use client';

import { ModuleShell } from '@/components/layout/module-shell';
import { LayoutDashboard, Users, Building, CalendarOff, Wallet, Clock } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/hr', icon: <LayoutDashboard /> },
  { label: 'Employees', href: '/hr/employees', icon: <Users /> },
  { label: 'Departments', href: '/hr/departments', icon: <Building /> },
  { label: 'Leave', href: '/hr/leave', icon: <CalendarOff /> },
  { label: 'Payroll', href: '/hr/payroll', icon: <Wallet /> },
  { label: 'Attendance', href: '/hr/attendance', icon: <Clock /> },
];

export default function HRLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleShell moduleId="hr" navItems={navItems} settingsHref="/hr/settings">
      {children}
    </ModuleShell>
  );
}
