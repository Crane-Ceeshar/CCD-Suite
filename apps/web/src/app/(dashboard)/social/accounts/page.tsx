'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, CardContent, Badge, Button, CcdLoader } from '@ccd/ui';
import { Plus, Unplug, ExternalLink } from 'lucide-react';
import { apiGet, apiPatch, apiDelete } from '@/lib/api';
import { AccountDialog } from '@/components/social/account-dialog';
import type { SocialAccount } from '@ccd/shared/types/social';

const platformConfig: Record<string, { label: string; color: string }> = {
  facebook: { label: 'Facebook', color: '#1877F2' },
  instagram: { label: 'Instagram', color: '#E4405F' },
  twitter: { label: 'X (Twitter)', color: '#000000' },
  linkedin: { label: 'LinkedIn', color: '#0A66C2' },
  tiktok: { label: 'TikTok', color: '#000000' },
  youtube: { label: 'YouTube', color: '#FF0000' },
};

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
            const platform = platformConfig[account.platform];
            const status = statusConfig[account.status];
            return (
              <Card key={account.id} className="transition-shadow hover:shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {account.avatar_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={account.avatar_url}
                          alt={account.account_name}
                          className="h-10 w-10 rounded-full object-cover"
                          onError={(e) => {
                            // Fallback to initial letter on avatar load failure
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className="h-10 w-10 rounded-full items-center justify-center text-white text-sm font-bold"
                        style={{
                          backgroundColor: platform?.color,
                          display: account.avatar_url ? 'none' : 'flex',
                        }}
                      >
                        {account.account_name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{account.account_name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">{platform?.label}</p>
                          {typeof (account.metadata as Record<string, string>)?.account_type === 'string' && (
                            <span className="text-[10px] text-muted-foreground border rounded px-1">
                              {(account.metadata as Record<string, string>).account_type}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge variant={status?.variant}>{status?.label}</Badge>
                  </div>
                  <div className="flex gap-2 mt-4">
                    {account.account_id && account.account_id.startsWith('http') && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => window.open(account.account_id!, '_blank')}
                      >
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Profile
                      </Button>
                    )}
                    {account.status !== 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleReconnect(account.id)}
                      >
                        Reconnect
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleDisconnect(account.id)}
                    >
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
