'use client';

import * as React from 'react';
import {
  PageHeader,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  StatusBadge,
  CcdLoader,
  EmptyState,
  toast,
} from '@ccd/ui';
import { CheckCircle, XCircle, MessageSquare, Clock, FileText, Send } from 'lucide-react';
import Link from 'next/link';
import { apiGet, apiPatch, apiPost } from '@/lib/api';
import { formatDate } from '@ccd/shared';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface ContentItem {
  id: string;
  title: string;
  content_type: string;
  status: string;
  created_by: string;
}

interface Approval {
  id: string;
  content_item_id: string;
  reviewer_id: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  comments: string | null;
  created_at: string;
  content_item: ContentItem | null;
}

type Tab = 'pending' | 'submitted' | 'all';

/* -------------------------------------------------------------------------- */
/*  Status color helpers                                                      */
/* -------------------------------------------------------------------------- */

const APPROVAL_STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  approved: '#22C55E',
  rejected: '#EF4444',
  changes_requested: '#3B82F6',
};

const APPROVAL_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  changes_requested: 'Changes Requested',
};

/* -------------------------------------------------------------------------- */
/*  Page Component                                                            */
/* -------------------------------------------------------------------------- */

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = React.useState<Tab>('pending');
  const [approvals, setApprovals] = React.useState<Approval[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Action form state
  const [actionApprovalId, setActionApprovalId] = React.useState<string | null>(null);
  const [actionType, setActionType] = React.useState<'approve' | 'reject' | 'request_changes' | null>(null);
  const [actionComments, setActionComments] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  /* ---- Fetch approvals whenever the active tab changes ---- */
  const fetchApprovals = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<Approval[]>(`/api/content/approvals?tab=${activeTab}`);
      setApprovals(res.data ?? []);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load approvals',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  React.useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  /* ---- Handle approval actions ---- */
  const openActionForm = (approvalId: string, type: 'approve' | 'reject' | 'request_changes') => {
    setActionApprovalId(approvalId);
    setActionType(type);
    setActionComments('');
  };

  const closeActionForm = () => {
    setActionApprovalId(null);
    setActionType(null);
    setActionComments('');
  };

  const submitAction = async () => {
    if (!actionApprovalId || !actionType) return;

    setSubmitting(true);
    try {
      await apiPatch(`/api/content/approvals/${actionApprovalId}`, {
        action: actionType,
        comments: actionComments || undefined,
      });

      const actionLabels: Record<string, string> = {
        approve: 'approved',
        reject: 'rejected',
        request_changes: 'sent back for changes',
      };

      toast({
        title: 'Success',
        description: `Content has been ${actionLabels[actionType]}.`,
      });

      closeActionForm();
      fetchApprovals();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Action failed',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* ---- Tab definitions ---- */
  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'pending', label: 'Pending My Review', icon: <Clock className="h-4 w-4" /> },
    { key: 'submitted', label: 'My Submissions', icon: <Send className="h-4 w-4" /> },
    { key: 'all', label: 'All', icon: <FileText className="h-4 w-4" /> },
  ];

  /* ---- Render ---- */
  return (
    <div className="space-y-6">
      <PageHeader
        title="Approvals"
        description="Review and approve content before publishing"
        breadcrumbs={[
          { label: 'Content', href: '/content' },
          { label: 'Approvals' },
        ]}
      />

      {/* Tab navigation */}
      <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <CcdLoader size="lg" />
        </div>
      ) : approvals.length === 0 ? (
        <EmptyState
          icon={<CheckCircle className="h-6 w-6 text-muted-foreground" />}
          title={
            activeTab === 'pending'
              ? 'No pending reviews'
              : activeTab === 'submitted'
              ? 'No submissions'
              : 'No approvals'
          }
          description={
            activeTab === 'pending'
              ? 'You have no content items waiting for your review.'
              : activeTab === 'submitted'
              ? 'You haven\'t submitted any content for review yet.'
              : 'No approval records found.'
          }
        />
      ) : (
        <div className="grid gap-4">
          {approvals.map((approval) => (
            <Card key={approval.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <CardTitle className="text-base">
                      {approval.content_item ? (
                        <Link
                          href={`/content/editor?id=${approval.content_item.id}`}
                          className="hover:underline"
                        >
                          {approval.content_item.title}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">Untitled</span>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      {approval.content_item?.content_type && (
                        <Badge variant="secondary" className="text-xs capitalize">
                          {approval.content_item.content_type.replace(/_/g, ' ')}
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{
                          borderColor: APPROVAL_STATUS_COLORS[approval.status] ?? '#6B7280',
                          color: APPROVAL_STATUS_COLORS[approval.status] ?? '#6B7280',
                        }}
                      >
                        {APPROVAL_STATUS_LABELS[approval.status] ?? approval.status}
                      </Badge>
                      {approval.content_item?.status && (
                        <StatusBadge status={approval.content_item.status} />
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(approval.created_at)}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Comments from previous review */}
                {approval.comments && (
                  <div className="mb-3 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Review comment:</span>{' '}
                    {approval.comments}
                  </div>
                )}

                {/* Action buttons — only show on pending tab */}
                {activeTab === 'pending' && approval.status === 'pending' && (
                  <>
                    {actionApprovalId === approval.id ? (
                      <div className="space-y-3 rounded-md border p-4">
                        <div className="text-sm font-medium">
                          {actionType === 'approve' && 'Approve this content'}
                          {actionType === 'reject' && 'Reject this content'}
                          {actionType === 'request_changes' && 'Request changes'}
                        </div>
                        <textarea
                          value={actionComments}
                          onChange={(e) => setActionComments(e.target.value)}
                          placeholder={
                            actionType === 'approve'
                              ? 'Optional comment...'
                              : 'Add your feedback or reason...'
                          }
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px] resize-y"
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={submitAction}
                            disabled={submitting}
                            variant={
                              actionType === 'approve'
                                ? 'default'
                                : actionType === 'reject'
                                ? 'destructive'
                                : 'outline'
                            }
                          >
                            {submitting ? 'Submitting...' : 'Confirm'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={closeActionForm}
                            disabled={submitting}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => openActionForm(approval.id, 'approve')}
                        >
                          <CheckCircle className="mr-1.5 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openActionForm(approval.id, 'reject')}
                        >
                          <XCircle className="mr-1.5 h-4 w-4" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openActionForm(approval.id, 'request_changes')}
                        >
                          <MessageSquare className="mr-1.5 h-4 w-4" />
                          Request Changes
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
