'use client';

import { ModuleShell } from '@/components/layout/module-shell';
import { LayoutDashboard, FileText, Receipt, CreditCard } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/finance', icon: <LayoutDashboard /> },
  { label: 'Invoices', href: '/finance/invoices', icon: <FileText /> },
  { label: 'Expenses', href: '/finance/expenses', icon: <Receipt /> },
  { label: 'Payments', href: '/finance/payments', icon: <CreditCard /> },
];

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleShell moduleId="finance" navItems={navItems}>
      {children}
    </ModuleShell>
  );
}
