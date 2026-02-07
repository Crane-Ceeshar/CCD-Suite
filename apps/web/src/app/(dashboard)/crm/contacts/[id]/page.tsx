'use client';

import * as React from 'react';
import {
  PageHeader,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  StatusBadge,
  UserAvatar,
  DataTable,
  type Column,
} from '@ccd/ui';
import { formatDate, formatCurrency } from '@ccd/shared';
import {
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  Pencil,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { apiGet } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { ContactDialog } from '@/components/crm/contact-dialog';

interface ContactDetail {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  company_id: string | null;
  company: { id: string; name: string } | null;
  status: string;
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

type ContactForDialog = Parameters<typeof ContactDialog>[0]['contact'];

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [contact, setContact] = React.useState<ContactDetail | null>(null);
  const [deals, setDeals] = React.useState<DealRow[]>([]);
  const [activities, setActivities] = React.useState<ActivityRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'overview' | 'deals' | 'activities'>('overview');

  const loadContact = React.useCallback(async () => {
    try {
      const res = await apiGet<ContactDetail>(`/api/crm/contacts/${id}`);
      setContact(res.data);
    } catch {
      /* ignore */
    }
  }, [id]);

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      await loadContact();

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
  }, [id, loadContact]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        Contact not found.
      </div>
    );
  }

  const fullName = `${contact.first_name} ${contact.last_name}`;

  const dealColumns: Column<DealRow>[] = [
    { key: 'title', header: 'Deal', sortable: true },
    {
      key: 'value',
      header: 'Value',
      render: (d) => formatCurrency(d.value, d.currency),
    },
    {
      key: 'stage',
      header: 'Stage',
      render: (d) =>
        d.stage ? (
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.stage.color }} />
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
      key: 'scheduled_at',
      header: 'Scheduled',
      render: (a) => (a.scheduled_at ? formatDate(a.scheduled_at) : '-'),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (a) => formatDate(a.created_at),
    },
  ];

  const tabs = [
    { key: 'overview' as const, label: 'Overview' },
    { key: 'deals' as const, label: `Deals (${deals.length})` },
    { key: 'activities' as const, label: `Activities (${activities.length})` },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={fullName}
        description={contact.job_title ?? 'Contact'}
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Contacts', href: '/crm/contacts' },
          { label: fullName },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/crm/contacts')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        }
      />

      {/* Contact Info Header */}
      <Card>
        <CardContent className="flex items-start gap-6 p-6">
          <UserAvatar name={fullName} size="lg" />
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">{fullName}</h2>
              <StatusBadge status={contact.status} />
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              {contact.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${contact.email}`} className="hover:text-foreground">
                    {contact.email}
                  </a>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{contact.phone}</span>
                </div>
              )}
              {contact.company && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <a href={`/crm/companies/${contact.company.id}`} className="hover:text-foreground hover:underline">
                    {contact.company.name}
                  </a>
                </div>
              )}
              {contact.job_title && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  <span>{contact.job_title}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Added {formatDate(contact.created_at)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
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

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {contact.notes || 'No notes yet.'}
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
                <p className="text-sm text-muted-foreground">No activities yet.</p>
              ) : (
                <div className="space-y-3">
                  {activities.slice(0, 5).map((a) => (
                    <div key={a.id} className="flex items-start gap-3">
                      <span className="mt-0.5 rounded bg-muted px-2 py-0.5 text-[10px] font-medium capitalize">
                        {a.type}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{a.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(a.created_at)}</p>
                      </div>
                      {a.is_completed && (
                        <span className="text-[10px] text-green-600 font-medium">Done</span>
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
          emptyMessage="No deals associated with this contact."
        />
      )}

      {activeTab === 'activities' && (
        <DataTable
          columns={activityColumns}
          data={activities}
          keyExtractor={(a) => a.id}
          emptyMessage="No activities for this contact."
        />
      )}

      <ContactDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        contact={contact as unknown as ContactForDialog}
        onSuccess={() => {
          setDialogOpen(false);
          loadContact();
        }}
      />
    </div>
  );
}
