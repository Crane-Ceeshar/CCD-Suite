'use client';

import { useState } from 'react';
import {
  PageHeader,
  Card,
  CardContent,
  Badge,
  Button,
  Input,
  Skeleton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ccd/ui';
import { FileText, Plus, Search, Send, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { useContracts } from '@/hooks/use-hr';
import { ContractDialog } from '@/components/hr/contract-dialog';

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  draft: 'secondary',
  sent: 'outline',
  viewed: 'outline',
  signed: 'default',
  expired: 'destructive',
  cancelled: 'destructive',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  draft: <Clock className="h-3 w-3" />,
  sent: <Send className="h-3 w-3" />,
  viewed: <Eye className="h-3 w-3" />,
  signed: <CheckCircle className="h-3 w-3" />,
  expired: <XCircle className="h-3 w-3" />,
  cancelled: <XCircle className="h-3 w-3" />,
};

const TYPE_LABELS: Record<string, string> = {
  employment: 'Employment',
  nda: 'NDA',
  amendment: 'Amendment',
  other: 'Other',
};

export default function ContractsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: response, isLoading } = useContracts({
    status: statusFilter === 'all' ? '' : statusFilter,
    type: typeFilter === 'all' ? '' : typeFilter,
    search,
    sort: 'created_at',
    dir: 'desc',
  });

  const contracts = (response?.data as any[]) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Contracts"
          description="Manage employee contracts and agreements"
        />
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Contract
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search contracts..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="viewed">Viewed</SelectItem>
            <SelectItem value="signed">Signed</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="employment">Employment</SelectItem>
            <SelectItem value="nda">NDA</SelectItem>
            <SelectItem value="amendment">Amendment</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Contracts List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : contracts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">No Contracts Yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first contract to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {contracts.map((contract: any) => (
            <Link key={contract.id} href={`/hr/contracts/${contract.id}`}>
              <Card className="transition-shadow hover:shadow-md cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{contract.title}</h3>
                        <Badge variant="outline">{TYPE_LABELS[contract.type] ?? contract.type}</Badge>
                        <Badge variant={STATUS_VARIANTS[contract.status] ?? 'secondary'} className="gap-1">
                          {STATUS_ICONS[contract.status]}
                          {contract.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {contract.employee
                          ? `${contract.employee.first_name} ${contract.employee.last_name}`
                          : 'Unknown Employee'}
                        {contract.sent_at && ` · Sent ${new Date(contract.sent_at).toLocaleDateString()}`}
                        {contract.signed_at && ` · Signed ${new Date(contract.signed_at).toLocaleDateString()}`}
                      </p>
                    </div>
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <ContractDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
