'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  PageHeader,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  StatusBadge,
  UserAvatar,
  cn,
  CcdLoader,
  type Column,
} from '@ccd/ui';
import { formatDate } from '@ccd/shared';
import {
  ArrowLeft,
  Pencil,
  UserCheck,
  Mail,
  Phone,
  Building2,
  Globe,
  Calendar,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { apiGet, apiPatch } from '@/lib/api';
import { LeadDialog, type LeadForDialog } from '@/components/crm/lead-dialog';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface LeadDetail {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  company_id: string | null;
  company: { id: string; name: string } | null;
  status: string;
  website: string | null;
  lead_source: string | null;
  lead_status: string | null;
  qualification: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface DealRow {
  id: string;
  title: string;
  value: number;
  currency: string;
  status: string;
  stage: { id: string; name: string; color: string } | null;
  created_at: string;
  [key: string]: unknown;
}

interface ActivityRow {
  id: string;
  type: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  scheduled_at: string | null;
  created_at: string;
  [key: string]: unknown;
}

/* ------------------------------------------------------------------ */
/* Lead‑status progression                                             */
/* ------------------------------------------------------------------ */

const LEAD_STATUSES = [
  { key: 'new_lead', label: 'New Lead' },
  { key: 'attempted_to_contact', label: 'Attempted to Contact' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'closed', label: 'Closed' },
] as const;

/* ------------------------------------------------------------------ */
/* Page Component                                                      */
/* ------------------------------------------------------------------ */

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [lead, setLead] = React.useState<LeadDetail | null>(null);
  const [deals, setDeals] = React.useState<DealRow[]>([]);
  const [activities, setActivities] = React.useState<ActivityRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'overview' | 'deals' | 'activities'>('overview');

  /* ---- data fetching ---- */

  const loadLead = React.useCallback(async () => {
    try {
      const res = await apiGet<LeadDetail>(`/api/crm/contacts/${id}`);
      setLead(res.data);
    } catch {
      /* ignore */
    }
  }, [id]);

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      await loadLead();

      try {
        const [dealsRes, activitiesRes] = await Promise.all([
          apiGet<DealRow[]>(`/api/crm/deals?contact_id=${id}`),
          apiGet<ActivityRow[]>(`/api/crm/activities?contact_id=${id}`),
        ]);
        setDeals(dealsRes.data);
        setActivities(activitiesRes.data);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, loadLead]);

  /* ---- mutations ---- */

  async function handleStatusChange(newStatus: string) {
    await apiPatch(`/api/crm/contacts/${id}`, { lead_status: newStatus });
    await loadLead();
  }

  async function handleQualificationChange(value: string) {
    await apiPatch(`/api/crm/contacts/${id}`, { qualification: value });
    await loadLead();
  }

  async function handleTransfer() {
    await apiPatch(`/api/crm/contacts/${id}`, { status: 'active' });
    router.push(`/crm/contacts/${id}`);
  }

  /* ---- loading / error states ---- */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <CcdLoader size="lg" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        Lead not found.
      </div>
    );
  }

  /* ---- derived values ---- */

  const fullName = `${lead.first_name} ${lead.last_name}`;

  const currentStatusIndex = LEAD_STATUSES.findIndex(
    (s) => s.key === lead.lead_status,
  );

  /* ---- column definitions ---- */

  const dealColumns: Column<DealRow>[] = [
    { key: 'title', header: 'Deal', sortable: true },
    {
      key: 'value',
      header: 'Value',
      render: (d) => {
        const formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: d.currency || 'USD',
        }).format(d.value);
        return formatted;
      },
    },
    {
      key: 'stage',
      header: 'Stage',
      render: (d) =>
        d.stage ? (
          <span className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: d.stage.color }}
            />
            {d.stage.name}
          </span>
        ) : null,
    },
    {
      key: 'status',
      header: 'Status',
      render: (d) => <StatusBadge status={d.status} />,
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (d) => formatDate(d.created_at),
    },
  ];

  const activityColumns: Column<ActivityRow>[] = [
    {
      key: 'type',
      header: 'Type',
      render: (a) => (
        <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium capitalize">
          {a.type}
        </span>
      ),
    },
    { key: 'title', header: 'Title' },
    {
      key: 'is_completed',
      header: 'Status',
      render: (a) => (
        <StatusBadge status={a.is_completed ? 'completed' : 'pending'} />
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (a) => formatDate(a.created_at),
    },
  ];

  /* ---- tabs ---- */

  const tabs = [
    { key: 'overview' as const, label: 'Overview' },
    { key: 'deals' as const, label: `Deals (${deals.length})` },
    { key: 'activities' as const, label: `Activities (${activities.length})` },
  ];

  /* ---- render ---- */

  return (
    <div className="space-y-6">
      {/* ---- Header ---- */}
      <PageHeader
        title={fullName}
        description={lead.job_title ?? 'Lead'}
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Leads', href: '/crm/leads' },
          { label: fullName },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/crm/leads')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button variant="outline" onClick={() => setDialogOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              className="bg-green-600 text-white hover:bg-green-700"
              onClick={handleTransfer}
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Transfer to Contact
            </Button>
          </div>
        }
      />

      {/* ---- Status Progression Bar ---- */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {LEAD_STATUSES.map((step, idx) => {
              const isActive = idx <= currentStatusIndex;
              const isCurrent = idx === currentStatusIndex;
              return (
                <React.Fragment key={step.key}>
                  {idx > 0 && (
                    <div
                      className={cn(
                        'h-0.5 flex-1',
                        idx <= currentStatusIndex
                          ? 'bg-primary'
                          : 'bg-muted',
                      )}
                    />
                  )}
                  <button
                    onClick={() => handleStatusChange(step.key)}
                    className={cn(
                      'relative flex shrink-0 items-center justify-center rounded-full px-4 py-2 text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80',
                      isCurrent && 'ring-2 ring-primary ring-offset-2',
                    )}
                  >
                    {step.label}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ---- Qualification Buttons ---- */}
      <div className="flex gap-3">
        <Button
          variant={lead.qualification === 'qualified' ? 'default' : 'outline'}
          className={cn(
            lead.qualification === 'qualified' &&
              'bg-green-600 text-white hover:bg-green-700',
          )}
          onClick={() => handleQualificationChange('qualified')}
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Qualified
        </Button>
        <Button
          variant={lead.qualification === 'unqualified' ? 'default' : 'outline'}
          className={cn(
            lead.qualification === 'unqualified' &&
              'bg-red-600 text-white hover:bg-red-700',
          )}
          onClick={() => handleQualificationChange('unqualified')}
        >
          <XCircle className="mr-2 h-4 w-4" />
          Unqualified
        </Button>
      </div>

      {/* ---- Lead Info Card ---- */}
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Left column */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <UserAvatar name={fullName} size="lg" />
                <div>
                  <h2 className="text-lg font-semibold">{fullName}</h2>
                  <StatusBadge status={lead.status} />
                </div>
              </div>
              {lead.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <a
                    href={`mailto:${lead.email}`}
                    className="hover:text-foreground"
                  >
                    {lead.email}
                  </a>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{lead.phone}</span>
                </div>
              )}
              {lead.job_title && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>{lead.job_title}</span>
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-4">
              {lead.company && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <a
                    href={`/crm/companies/${lead.company.id}`}
                    className="hover:text-foreground hover:underline"
                  >
                    {lead.company.name}
                  </a>
                </div>
              )}
              {lead.website && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <a
                    href={
                      lead.website.startsWith('http')
                        ? lead.website
                        : `https://${lead.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground hover:underline"
                  >
                    {lead.website}
                  </a>
                </div>
              )}
              {lead.lead_source && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
                    Source
                  </span>
                  <span className="capitalize">
                    {lead.lead_source.replace(/_/g, ' ')}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Added {formatDate(lead.created_at)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---- Tabs ---- */}
      <div className="border-b">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ---- Tab Content ---- */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {lead.notes || 'No notes yet.'}
              </p>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No activities yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {activities.slice(0, 5).map((a) => (
                    <div key={a.id} className="flex items-start gap-3">
                      <span className="mt-0.5 rounded bg-muted px-2 py-0.5 text-[10px] font-medium capitalize">
                        {a.type}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {a.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(a.created_at)}
                        </p>
                      </div>
                      {a.is_completed && (
                        <span className="text-[10px] font-medium text-green-600">
                          Done
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'deals' && (
        <DataTable
          columns={dealColumns}
          data={deals}
          keyExtractor={(d) => d.id}
          emptyMessage="No deals associated with this lead."
        />
      )}

      {activeTab === 'activities' && (
        <DataTable
          columns={activityColumns}
          data={activities}
          keyExtractor={(a) => a.id}
          emptyMessage="No activities for this lead."
        />
      )}

      {/* ---- Dialogs ---- */}
      <LeadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lead={lead as unknown as LeadForDialog}
        onSuccess={() => {
          setDialogOpen(false);
          loadLead();
        }}
      />
    </div>
  );
}
