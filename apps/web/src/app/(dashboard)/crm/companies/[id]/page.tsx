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
  Globe,
  Mail,
  Phone,
  MapPin,
  Building2,
  Pencil,
  ArrowLeft,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { apiGet } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { CompanyDialog } from '@/components/crm/company-dialog';
import { EnrichButton } from '@/components/ai/enrich-button';

interface CompanyDetail {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface ContactRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  status: string;
  created_at: string;
  [key: string]: unknown;
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

interface PortalProject {
  id: string;
  name: string;
  status: string;
  created_at: string;
  contact?: { id: string; first_name: string; last_name: string } | null;
}

type CompanyForDialog = Parameters<typeof CompanyDialog>[0]['company'];

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [company, setCompany] = React.useState<CompanyDetail | null>(null);
  const [contacts, setContacts] = React.useState<ContactRow[]>([]);
  const [deals, setDeals] = React.useState<DealRow[]>([]);
  const [activities, setActivities] = React.useState<ActivityRow[]>([]);
  const [portalProjects, setPortalProjects] = React.useState<PortalProject[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'overview' | 'contacts' | 'deals' | 'activities' | 'portal'>('overview');

  const loadCompany = React.useCallback(async () => {
    try {
      const res = await apiGet<CompanyDetail>(`/api/crm/companies/${id}`);
      setCompany(res.data);
    } catch {
      /* ignore */
    }
  }, [id]);

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      await loadCompany();

      try {
        const [contactsRes, dealsRes, activitiesRes, portalRes] = await Promise.all([
          apiGet<ContactRow[]>(`/api/crm/contacts?company_id=${id}`),
          apiGet<DealRow[]>(`/api/crm/deals?company_id=${id}`),
          apiGet<ActivityRow[]>(`/api/crm/activities?company_id=${id}`),
          apiGet<PortalProject[]>(`/api/portal/projects?company_id=${id}`).catch(() => ({ data: [] as PortalProject[] })),
        ]);
        setContacts(contactsRes.data);
        setDeals(dealsRes.data);
        setActivities(activitiesRes.data);
        setPortalProjects(portalRes.data);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, loadCompany]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        Company not found.
      </div>
    );
  }

  const addressParts = [company.address, company.city, company.state, company.country]
    .filter(Boolean)
    .join(', ');

  const totalDealValue = deals.reduce((sum, d) => sum + (d.value ?? 0), 0);

  const contactColumns: Column<ContactRow>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (c) => (
        <div className="flex items-center gap-3">
          <UserAvatar name={`${c.first_name} ${c.last_name}`} size="sm" />
          <div>
            <a href={`/crm/contacts/${c.id}`} className="font-medium hover:underline">
              {c.first_name} {c.last_name}
            </a>
            {c.job_title && <p className="text-xs text-muted-foreground">{c.job_title}</p>}
          </div>
        </div>
      ),
    },
    { key: 'email', header: 'Email', render: (c) => c.email ?? '-' },
    { key: 'phone', header: 'Phone', render: (c) => c.phone ?? '-' },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
  ];

  const dealColumns: Column<DealRow>[] = [
    { key: 'title', header: 'Deal', sortable: true },
    { key: 'value', header: 'Value', render: (d) => formatCurrency(d.value, d.currency) },
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
    { key: 'status', header: 'Status', render: (d) => <StatusBadge status={d.status} /> },
    { key: 'created_at', header: 'Created', render: (d) => formatDate(d.created_at) },
  ];

  const activityColumns: Column<ActivityRow>[] = [
    {
      key: 'type',
      header: 'Type',
      render: (a) => (
        <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium capitalize">{a.type}</span>
      ),
    },
    { key: 'title', header: 'Title' },
    {
      key: 'is_completed',
      header: 'Status',
      render: (a) => <StatusBadge status={a.is_completed ? 'completed' : 'pending'} />,
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (a) => formatDate(a.created_at),
    },
  ];

  const tabs = [
    { key: 'overview' as const, label: 'Overview' },
    { key: 'contacts' as const, label: `Contacts (${contacts.length})` },
    { key: 'deals' as const, label: `Deals (${deals.length})` },
    { key: 'activities' as const, label: `Activities (${activities.length})` },
    { key: 'portal' as const, label: `Portal (${portalProjects.length})` },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={company.name}
        description={company.industry ?? 'Company'}
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Companies', href: '/crm/companies' },
          { label: company.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push('/crm/companies')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <EnrichButton
              entityType="company"
              entityId={company.id}
              entityData={{
                name: company.name,
                industry: company.industry,
                website: company.website,
                email: company.email,
                phone: company.phone,
              }}
              onEnrichApplied={loadCompany}
            />
            <Button onClick={() => setDialogOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        }
      />

      {/* Company Info */}
      <Card>
        <CardContent className="flex items-start gap-6 p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted">
            <Building2 className="h-7 w-7 text-muted-foreground" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">{company.name}</h2>
              <StatusBadge status={company.status} />
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              {company.industry && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>{company.industry}</span>
                </div>
              )}
              {company.website && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground hover:underline"
                  >
                    {company.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {company.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${company.email}`} className="hover:text-foreground">
                    {company.email}
                  </a>
                </div>
              )}
              {company.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{company.phone}</span>
                </div>
              )}
              {addressParts && (
                <div className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{addressParts}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold">{contacts.length}</p>
            <p className="text-xs text-muted-foreground">Contacts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold">{deals.length}</p>
            <p className="text-xs text-muted-foreground">Deals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold">${totalDealValue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Value</p>
          </CardContent>
        </Card>
      </div>

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
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {company.notes || 'No notes yet.'}
              </p>
            </CardContent>
          </Card>
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
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'contacts' && (
        <DataTable
          columns={contactColumns}
          data={contacts}
          keyExtractor={(c) => c.id}
          emptyMessage="No contacts at this company."
        />
      )}

      {activeTab === 'deals' && (
        <DataTable
          columns={dealColumns}
          data={deals}
          keyExtractor={(d) => d.id}
          emptyMessage="No deals with this company."
        />
      )}

      {activeTab === 'activities' && (
        <DataTable
          columns={activityColumns}
          data={activities}
          keyExtractor={(a) => a.id}
          emptyMessage="No activities for this company."
        />
      )}

      {activeTab === 'portal' && (
        <div className="space-y-4">
          {portalProjects.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  No portal projects linked to contacts at this company.
                </p>
              </CardContent>
            </Card>
          ) : (
            portalProjects.map((project) => (
              <Card key={project.id} className="transition-shadow hover:shadow-sm">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium">{project.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <StatusBadge status={project.status} />
                      {project.contact && (
                        <span>
                          Contact: {project.contact.first_name} {project.contact.last_name}
                        </span>
                      )}
                      <span>{formatDate(project.created_at)}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/portal/projects/${project.id}`)}
                  >
                    <ExternalLink className="mr-2 h-3 w-3" />
                    Open
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      <CompanyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        company={company as unknown as CompanyForDialog}
        onSuccess={() => {
          setDialogOpen(false);
          loadCompany();
        }}
      />
    </div>
  );
}
