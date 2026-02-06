import { PageHeader, StatCard, Card, CardContent, CardHeader, CardTitle } from '@ccd/ui';
import { DollarSign, FileText, Receipt, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function FinanceDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance"
        description="Invoicing, expenses, and financial tracking"
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenue"
          value="$0"
          change="This month"
          trend="neutral"
          icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#14B8A6"
        />
        <StatCard
          label="Outstanding"
          value="$0"
          change="Unpaid invoices"
          trend="neutral"
          icon={<FileText className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#14B8A6"
        />
        <StatCard
          label="Expenses"
          value="$0"
          change="This month"
          trend="neutral"
          icon={<Receipt className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#14B8A6"
        />
        <StatCard
          label="Profit"
          value="$0"
          change="Revenue - Expenses"
          trend="neutral"
          icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#14B8A6"
        />
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
    </div>
  );
}
