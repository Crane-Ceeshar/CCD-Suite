'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, CardContent, Badge, Button, CcdLoader } from '@ccd/ui';
import { Plus, Unplug, ExternalLink, Trash2 } from 'lucide-react';
import { apiGet, apiPatch, apiDelete } from '@/lib/api';
import { AccountDialog } from '@/components/social/account-dialog';
import { PlatformIcon, getPlatformColor, platformLabels } from '@/components/social/platform-icon';
import type { SocialAccount } from '@ccd/shared/types/social';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  active: { label: 'Connected', variant: 'default' },
  disconnected: { label: 'Disconnected', variant: 'destructive' },
  expired: { label: 'Expired', variant: 'secondary' },
};

export default function SocialAccountsPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<SocialAccount[]>('/api/social/accounts');
      setAccounts(res.data);
    } catch {
      // keep empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  async function handleDisconnect(id: string) {
    if (!confirm('Are you sure you want to disconnect this account?')) return;
    try {
      await apiDelete(`/api/social/accounts/${id}`);
      fetchAccounts();
    } catch {
      alert('Failed to disconnect account');
    }
  }

  async function handleReconnect(id: string) {
    try {
      await apiPatch(`/api/social/accounts/${id}`, { status: 'active' });
      fetchAccounts();
    } catch {
      alert('Failed to reconnect account');
    }
  }

  if (loading && accounts.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Social Accounts"
          description="Manage connected social media accounts"
        />
        <div className="flex items-center justify-center py-24">
          <CcdLoader size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Social Accounts"
        description="Manage connected social media accounts"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Connect Account
          </Button>
        }
      />

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Unplug className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No connected accounts</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Connect your social media accounts to start publishing
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Connect Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => {
            const platformColor = getPlatformColor(account.platform);
            const platformLabel = platformLabels[account.platform] ?? account.platform;
            const status = statusConfig[account.status];
            const meta = account.metadata as Record<string, string> | null;
            const accountType = typeof meta?.account_type === 'string' ? meta.account_type : null;
            const profileUrl = account.account_id?.startsWith('http') ? account.account_id : null;

            return (
              <Card
                key={account.id}
                className="overflow-hidden transition-shadow hover:shadow-md"
              >
                {/* Platform accent bar */}
                <div className="h-1" style={{ backgroundColor: platformColor }} />

                <CardContent className="pt-5">
                  <div className="flex items-start gap-4">
                    {/* Avatar with platform badge overlay */}
                    <div className="relative shrink-0">
                      {/* Main avatar area */}
                      <div
                        className="h-12 w-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${platformColor}15` }}
                      >
                        <PlatformIcon platform={account.platform} size={24} />
                      </div>

                      {/* Status dot */}
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background ${
                          account.status === 'active'
                            ? 'bg-green-500'
                            : account.status === 'expired'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}
                      />
                    </div>

                    {/* Account info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">
                            {account.account_name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className="text-xs font-medium"
                              style={{ color: platformColor }}
                            >
                              {platformLabel}
                            </span>
                            {accountType && (
                              <>
                                <span className="text-muted-foreground text-[10px]">•</span>
                                <span className="text-[11px] text-muted-foreground capitalize">
                                  {accountType}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <Badge variant={status?.variant} className="shrink-0 text-[10px]">
                          {status?.label}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                    {profileUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 text-xs"
                        onClick={() => window.open(profileUrl, '_blank')}
                      >
                        <ExternalLink className="mr-1.5 h-3 w-3" />
                        View Profile
                      </Button>
                    )}
                    {account.status !== 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 text-xs"
                        onClick={() => handleReconnect(account.id)}
                      >
                        Reconnect
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs text-destructive hover:text-destructive"
                      onClick={() => handleDisconnect(account.id)}
                    >
                      <Trash2 className="mr-1.5 h-3 w-3" />
                      Disconnect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AccountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchAccounts}
      />
    </div>
  );
}
