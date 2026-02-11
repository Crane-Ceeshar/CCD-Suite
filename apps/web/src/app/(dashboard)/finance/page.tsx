'use client';

import {
  PageHeader,
  StatCard,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@ccd/ui';
import {
  DollarSign,
  FileText,
  Receipt,
  TrendingUp,
  AlertTriangle,
  Hash,
} from 'lucide-react';
import Link from 'next/link';
import { AskAiButton } from '@/components/ai/ask-ai-button';
import { useFinanceStats } from '@/hooks/use-finance';

const MODULE_COLOR = '#14B8A6';

function formatCurrency(value: number | undefined | null): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

function StatCardSkeleton() {
  return (
    <Card className="relative overflow-hidden">
      <div
        className="absolute left-0 top-0 h-full w-1"
        style={{ backgroundColor: MODULE_COLOR }}
      />
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-28" />
          </div>
          <Skeleton className="h-11 w-11 rounded-lg" />
        </div>
        <Skeleton className="mt-3 h-3 w-24" />
      </CardContent>
    </Card>
  );
}

export default function FinanceDashboardPage() {
  const { data: rawStats, isLoading } = useFinanceStats();
  const stats = rawStats?.data as {
    total_revenue: number;
    outstanding: number;
    total_expenses: number;
    profit: number;
    invoice_count: number;
    expense_count: number;
    overdue_count: number;
  } | undefined;

  const hasOverdue = (stats?.overdue_count ?? 0) > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance"
        description="Invoicing, expenses, and financial tracking"
      />

      {/* Financial stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Revenue"
              value={formatCurrency(stats?.total_revenue)}
              change="This month"
              trend={
                (stats?.total_revenue ?? 0) > 0 ? 'up' : 'neutral'
              }
              icon={
                <DollarSign className="h-5 w-5 text-muted-foreground" />
              }
              moduleColor={MODULE_COLOR}
            />
            <StatCard
              label="Outstanding"
              value={formatCurrency(stats?.outstanding)}
              change="Unpaid invoices"
              trend={
                (stats?.outstanding ?? 0) > 0 ? 'down' : 'neutral'
              }
              icon={
                <FileText className="h-5 w-5 text-muted-foreground" />
              }
              moduleColor={MODULE_COLOR}
            />
            <StatCard
              label="Expenses"
              value={formatCurrency(stats?.total_expenses)}
              change="This month"
              trend={
                (stats?.total_expenses ?? 0) > 0 ? 'down' : 'neutral'
              }
              icon={
                <Receipt className="h-5 w-5 text-muted-foreground" />
              }
              moduleColor={MODULE_COLOR}
            />
            <StatCard
              label="Profit"
              value={formatCurrency(stats?.profit)}
              change="Revenue - Expenses"
              trend={
                (stats?.profit ?? 0) > 0
                  ? 'up'
                  : (stats?.profit ?? 0) < 0
                    ? 'down'
                    : 'neutral'
              }
              icon={
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              }
              moduleColor={MODULE_COLOR}
            />
          </>
        )}
      </div>

      {/* Count stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Invoices"
              value={stats?.invoice_count ?? 0}
              change="Total invoices"
              trend="neutral"
              icon={
                <Hash className="h-5 w-5 text-muted-foreground" />
              }
              moduleColor={MODULE_COLOR}
            />
            <StatCard
              label="Expenses"
              value={stats?.expense_count ?? 0}
              change="Total expenses"
              trend="neutral"
              icon={
                <Receipt className="h-5 w-5 text-muted-foreground" />
              }
              moduleColor={MODULE_COLOR}
            />
            <StatCard
              label="Overdue"
              value={stats?.overdue_count ?? 0}
              change={hasOverdue ? 'Requires attention' : 'None overdue'}
              trend={hasOverdue ? 'down' : 'neutral'}
              icon={
                hasOverdue ? (
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                )
              }
              moduleColor={MODULE_COLOR}
            />
          </>
        )}
      </div>

      {/* Quick links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/finance/invoices">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create, send, and track invoices for your clients
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/finance/expenses">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Track and manage business expenses and approvals
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/finance/payments">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Record and view payment history for invoices
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <AskAiButton moduleContext="finance" />
    </div>
  );
}
