'use client';

import { ModuleShell } from '@/components/layout/module-shell';
import { HrSettingsDialog } from '@/components/hr/hr-settings-dialog';
import { LayoutDashboard, Users, Building, CalendarOff, Wallet, Clock, Network, Star, FileText } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/hr', icon: <LayoutDashboard /> },
  { label: 'Employees', href: '/hr/employees', icon: <Users /> },
  { label: 'Departments', href: '/hr/departments', icon: <Building /> },
  { label: 'Org Chart', href: '/hr/org-chart', icon: <Network /> },
  { label: 'Leave', href: '/hr/leave', icon: <CalendarOff /> },
  { label: 'Payroll', href: '/hr/payroll', icon: <Wallet /> },
  { label: 'Contracts', href: '/hr/contracts', icon: <FileText /> },
  { label: 'Attendance', href: '/hr/attendance', icon: <Clock /> },
  { label: 'Performance', href: '/hr/performance', icon: <Star /> },
];

export default function HRLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleShell
      moduleId="hr"
      navItems={navItems}
      renderSettings={({ open, onOpenChange }) => (
        <HrSettingsDialog open={open} onOpenChange={onOpenChange} />
      )}
    >
      {children}
    </ModuleShell>
  );
}
