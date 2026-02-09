'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Label,
  Badge,
  Separator,
  toast,
  CcdLoader,
  CcdSpinner,
} from '@ccd/ui';
import { Building2, Globe, Copy, Check, Save, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { apiGet, apiPatch } from '@/lib/api';

interface OrgData {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  plan: string;
  settings: Record<string, unknown> | null;
}

export default function OrganizationSettingsPage() {
  const [org, setOrg] = React.useState<OrgData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // Form state
  const [name, setName] = React.useState('');
  const [logoUrl, setLogoUrl] = React.useState('');

  // Slug availability state
  const [slugAvailable, setSlugAvailable] = React.useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = React.useState(false);

  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'ccdsuite.com';

  React.useEffect(() => {
    async function load() {
      try {
        const res = await apiGet<OrgData>('/api/settings/organization');
        setOrg(res.data);
        setName(res.data.name);
        setLogoUrl(res.data.logo_url ?? '');
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    if (!name.trim()) {
      toast({
        title: 'Validation error',
        description: 'Organization name cannot be empty.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const res = await apiPatch<OrgData>('/api/settings/organization', {
        name: name.trim(),
        logo_url: logoUrl.trim() || null,
      });
      setOrg(res.data);
      toast({
        title: 'Saved',
        description: 'Organization settings updated successfully.',
      });
    } catch (err) {
      toast({
        title: 'Failed to save',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  function copySubdomain() {
    if (!org?.slug) return;
    const url = `https://${org.slug}.${baseDomain}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copied', description: 'Subdomain URL copied to clipboard.' });
  }

  // Compute preview slug from the current name input
  const previewSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // Debounced slug availability check
  React.useEffect(() => {
    // If slug hasn't changed from current org slug, no check needed
    if (!previewSlug || previewSlug === org?.slug) {
      setSlugAvailable(null);
      setCheckingSlug(false);
      return;
    }

    setCheckingSlug(true);
    const timer = setTimeout(async () => {
      try {
        const res = await apiGet<{ available: boolean; slug: string }>(
          `/api/settings/organization/check-slug?slug=${encodeURIComponent(previewSlug)}`
        );
        setSlugAvailable(res.data.available);
      } catch {
        setSlugAvailable(null);
      } finally {
        setCheckingSlug(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [previewSlug, org?.slug]);

  const hasChanges = org && (name !== org.name || (logoUrl || '') !== (org.logo_url || ''));

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <CcdLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Organization Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Organization
          </CardTitle>
          <CardDescription>
            Manage your organization name, branding, and subdomain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Org Name */}
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization Name</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Organization"
            />
            <p className="text-xs text-muted-foreground">
              This name is displayed throughout the platform and determines your subdomain.
            </p>
          </div>

          {/* Subdomain */}
          <div className="space-y-2">
            <Label>Subdomain</Label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0 rounded-md border bg-muted/50 px-3 py-2 text-sm flex-1">
                <Globe className="h-4 w-4 text-muted-foreground mr-2 flex-shrink-0" />
                <span className="font-medium text-primary">
                  {previewSlug || org?.slug || '...'}
                </span>
                <span className="text-muted-foreground">.{baseDomain}</span>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={copySubdomain}
                disabled={!org?.slug}
                title="Copy subdomain URL"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            {/* Slug availability indicator */}
            {previewSlug && previewSlug !== org?.slug && (
              <div className="flex items-center gap-2">
                {checkingSlug && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CcdSpinner size="sm" />
                    <span>Checking availability...</span>
                  </div>
                )}
                {!checkingSlug && slugAvailable === true && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Available</span>
                  </div>
                )}
                {!checkingSlug && slugAvailable === false && (
                  <div className="flex items-center gap-1.5 text-xs text-destructive">
                    <XCircle className="h-4 w-4" />
                    <span>Not available</span>
                  </div>
                )}
              </div>
            )}
            {previewSlug && previewSlug !== org?.slug && (
              <p className="text-xs text-amber-600">
                Saving will change your subdomain from{' '}
                <span className="font-medium">{org?.slug}.{baseDomain}</span> to{' '}
                <span className="font-medium">{previewSlug}.{baseDomain}</span>
              </p>
            )}
          </div>

          {/* Logo URL */}
          <div className="space-y-2">
            <Label htmlFor="logo-url">Logo URL</Label>
            <Input
              id="logo-url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
            />
            <p className="text-xs text-muted-foreground">
              Enter a URL for your organization logo. This will be shown in the sidebar and portal.
            </p>
            {logoUrl && (
              <div className="mt-2 flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg border overflow-hidden bg-muted flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">Logo preview</span>
              </div>
            )}
          </div>

          {/* Save */}
          <div className="flex items-center justify-between pt-2">
            <div>
              {hasChanges && (
                <Badge variant="secondary" className="text-xs">
                  Unsaved changes
                </Badge>
              )}
            </div>
            <Button onClick={handleSave} disabled={saving || !hasChanges || slugAvailable === false}>
              {saving ? (
                <CcdSpinner size="sm" className="mr-2" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Plan & Info (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plan & Details</CardTitle>
          <CardDescription>
            Your current subscription and organization identifiers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Plan</p>
              <Badge variant="outline" className="text-sm capitalize">
                {org?.plan ?? 'free'}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Organization ID</p>
              <p className="text-sm font-mono text-muted-foreground">{org?.id ?? '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Dashboard URL</p>
              <p className="text-sm text-muted-foreground">
                https://{org?.slug ?? '...'}.{baseDomain}/dashboard
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Slug</p>
              <p className="text-sm font-mono text-muted-foreground">{org?.slug ?? '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Separator />

      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-destructive flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Delete Organization
            </h3>
            <p className="text-sm text-muted-foreground">
              Permanently delete this organization and all its data. This action cannot be undone.
            </p>
          </div>
          <Button variant="destructive" disabled>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Organization
          </Button>
        </div>
      </div>
    </div>
  );
}
