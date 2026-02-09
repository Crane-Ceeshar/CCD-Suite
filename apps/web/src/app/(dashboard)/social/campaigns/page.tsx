'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Button, CcdLoader } from '@ccd/ui';
import { Plus } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { CampaignsTable } from '@/components/social/campaigns-table';
import { CampaignDialog } from '@/components/social/campaign-dialog';
import type { SocialCampaign } from '@ccd/shared/types/social';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<SocialCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCampaign, setEditCampaign] = useState<SocialCampaign | null>(null);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<SocialCampaign[]>('/api/social/campaigns');
      setCampaigns(res.data);
    } catch {
      // keep empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  function handleEdit(campaign: SocialCampaign) {
    setEditCampaign(campaign);
    setDialogOpen(true);
  }

  function handleCreate() {
    setEditCampaign(null);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns"
        description="Organise posts into marketing campaigns"
      >
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Campaign
        </Button>
      </PageHeader>

      {loading && campaigns.length === 0 ? (
        <div className="flex items-center justify-center py-24">
          <CcdLoader size="lg" />
        </div>
      ) : (
        <CampaignsTable
          campaigns={campaigns}
          loading={loading}
          onEdit={handleEdit}
          onRefresh={fetchCampaigns}
        />
      )}

      <CampaignDialog
        open={dialogOpen}
        onOpenChange={(v) => {
          setDialogOpen(v);
          if (!v) setEditCampaign(null);
        }}
        campaign={editCampaign}
        onSuccess={fetchCampaigns}
      />
    </div>
  );
}
