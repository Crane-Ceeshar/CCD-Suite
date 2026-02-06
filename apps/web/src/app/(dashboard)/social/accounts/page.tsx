'use client';

import { useState } from 'react';
import { PageHeader, Card, CardContent, Badge, Button } from '@ccd/ui';
import { Plus, Unplug } from 'lucide-react';

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
  const [accounts] = useState<any[]>([]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Social Accounts"
        description="Manage connected social media accounts"
      >
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Connect Account
        </Button>
      </PageHeader>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Unplug className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No connected accounts</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Connect your social media accounts to start publishing
            </p>
            <Button>
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
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: platform?.color }}
                      >
                        {account.account_name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{account.account_name}</p>
                        <p className="text-xs text-muted-foreground">{platform?.label}</p>
                      </div>
                    </div>
                    <Badge variant={status?.variant}>{status?.label}</Badge>
                  </div>
                  <div className="flex gap-2 mt-4">
                    {account.status !== 'active' && (
                      <Button size="sm" variant="outline" className="flex-1">
                        Reconnect
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-destructive">
                      Disconnect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
