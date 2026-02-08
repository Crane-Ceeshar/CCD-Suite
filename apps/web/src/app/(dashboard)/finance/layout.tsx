'use client';

import { ModuleShell } from '@/components/layout/module-shell';
import { FinanceSettingsDialog } from '@/components/finance/finance-settings-dialog';
import { LayoutDashboard, FileText, Receipt, CreditCard, TrendingUp, Calculator } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/finance', icon: <LayoutDashboard /> },
  { label: 'Invoices', href: '/finance/invoices', icon: <FileText /> },
  { label: 'Expenses', href: '/finance/expenses', icon: <Receipt /> },
  { label: 'Payments', href: '/finance/payments', icon: <CreditCard /> },
  { label: 'Revenue', href: '/finance/revenue', icon: <TrendingUp /> },
  { label: 'Tax', href: '/finance/tax', icon: <Calculator /> },
];

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleShell
      moduleId="finance"
      navItems={navItems}
      renderSettings={({ open, onOpenChange }) => (
        <FinanceSettingsDialog open={open} onOpenChange={onOpenChange} />
      )}
    >
      {children}
    </ModuleShell>
  );
}
