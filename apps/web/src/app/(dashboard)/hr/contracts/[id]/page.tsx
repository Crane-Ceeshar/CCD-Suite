'use client';

import { useState } from 'react';
import {
  PageHeader,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Skeleton,
} from '@ccd/ui';
import { ArrowLeft, Send, Download, FileText, CheckCircle, XCircle, Eye, Clock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useContract, useSendContract } from '@/hooks/use-hr';

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  draft: 'secondary',
  sent: 'outline',
  viewed: 'outline',
  signed: 'default',
  expired: 'destructive',
  cancelled: 'destructive',
};

const TYPE_LABELS: Record<string, string> = {
  employment: 'Employment Contract',
  nda: 'Non-Disclosure Agreement',
  amendment: 'Contract Amendment',
  other: 'Contract',
};

function DetailSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardContent className="pt-6 space-y-4">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6 space-y-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function ContractDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data: response, isLoading } = useContract(id);
  const contract = response?.data as any;
  const sendContract = useSendContract(id);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      await sendContract.mutateAsync({});
    } catch {
      // error handled by React Query
    } finally {
      setSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Contract Details" description="View contract information">
          <Link href="/hr/contracts">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </PageHeader>
        <DetailSkeleton />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="space-y-6">
        <PageHeader title="Contract Not Found" description="This contract could not be found">
          <Link href="/hr/contracts">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </PageHeader>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium mb-1">Contract not found</h3>
            <p className="text-sm text-muted-foreground">
              The contract you are looking for does not exist or has been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sections = Array.isArray(contract.content) ? contract.content : [];
  const signature = contract.signatures?.[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contract Details"
        description="View and manage contract"
      >
        <div className="flex gap-2">
          <Link href="/hr/contracts">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          {contract.status === 'draft' && (
            <Button onClick={handleSend} disabled={sending}>
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send to Employee
            </Button>
          )}
          {(contract.status === 'sent' || contract.status === 'viewed') && (
            <Button onClick={handleSend} disabled={sending} variant="outline">
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Resend
            </Button>
          )}
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{contract.title}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline">{TYPE_LABELS[contract.type] ?? contract.type}</Badge>
                  <Badge variant={STATUS_VARIANTS[contract.status] ?? 'secondary'}>
                    {contract.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {contract.file_url ? (
                <div className="border rounded-lg p-6 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">PDF document uploaded</p>
                  <a href={contract.file_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      View PDF
                    </Button>
                  </a>
                </div>
              ) : sections.length > 0 ? (
                <div className="space-y-6">
                  {sections.map((section: any, idx: number) => (
                    <div key={idx}>
                      {section.title && (
                        <h3 className="font-semibold text-sm mb-2">{section.title}</h3>
                      )}
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {section.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No content added yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Signature */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Signature</CardTitle>
            </CardHeader>
            <CardContent>
              {signature ? (
                <div className="space-y-3">
                  <div className="border rounded-lg p-4 bg-green-50">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800">Contract Signed</span>
                    </div>
                    {signature.signature_data && (
                      <div className="bg-white border rounded p-3 mb-3">
                        <img
                          src={signature.signature_data}
                          alt="Signature"
                          className="max-h-20 object-contain"
                        />
                      </div>
                    )}
                    {signature.typed_name && (
                      <p className="text-sm font-medium">{signature.typed_name}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Signed by {signature.signer?.first_name} {signature.signer?.last_name} on{' '}
                      {new Date(signature.signed_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Method: {signature.signature_method === 'draw' ? 'Hand-drawn' : 'Typed'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Clock className="h-5 w-5" />
                  <span className="text-sm">Awaiting signature</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Employee</p>
              <p className="text-sm font-medium">
                {contract.employee
                  ? `${contract.employee.first_name} ${contract.employee.last_name}`
                  : 'Unknown'}
              </p>
              {contract.employee?.email && (
                <p className="text-xs text-muted-foreground">{contract.employee.email}</p>
              )}
              {contract.employee?.job_title && (
                <p className="text-xs text-muted-foreground">{contract.employee.job_title}</p>
              )}
            </div>

            {contract.template && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Template</p>
                <p className="text-sm">{contract.template.name}</p>
              </div>
            )}

            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Timeline</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="h-2 w-2 rounded-full bg-blue-400" />
                  <span>Created: {new Date(contract.created_at).toLocaleDateString()}</span>
                </div>
                {contract.sent_at && (
                  <div className="flex items-center gap-2 text-xs">
                    <div className="h-2 w-2 rounded-full bg-orange-400" />
                    <span>Sent: {new Date(contract.sent_at).toLocaleDateString()}</span>
                  </div>
                )}
                {contract.viewed_at && (
                  <div className="flex items-center gap-2 text-xs">
                    <div className="h-2 w-2 rounded-full bg-yellow-400" />
                    <span>Viewed: {new Date(contract.viewed_at).toLocaleDateString()}</span>
                  </div>
                )}
                {contract.signed_at && (
                  <div className="flex items-center gap-2 text-xs">
                    <div className="h-2 w-2 rounded-full bg-green-400" />
                    <span>Signed: {new Date(contract.signed_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {contract.expires_at && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Expires</p>
                <p className="text-sm">{new Date(contract.expires_at).toLocaleDateString()}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
