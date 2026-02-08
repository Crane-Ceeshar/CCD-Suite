'use client';

import * as React from 'react';
import { Button, CcdSpinner } from '@ccd/ui';
import { toast } from '@ccd/ui';
import { ExternalLink, Send } from 'lucide-react';
import { apiPost } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface PortalProject {
  id: string;
  name: string;
  status: string;
}

interface PortalInviteButtonProps {
  contactId: string;
  contactEmail: string | null;
  contactName: string;
  portalProjects?: PortalProject[];
  onInviteSent?: () => void;
}

export function PortalInviteButton({
  contactId,
  contactEmail,
  contactName,
  portalProjects,
  onInviteSent,
}: PortalInviteButtonProps) {
  const router = useRouter();
  const [inviting, setInviting] = React.useState(false);

  const hasPortalProject = portalProjects && portalProjects.length > 0;

  async function handleInvite() {
    if (!contactEmail) {
      toast({
        title: 'No email',
        description: 'This contact has no email address. Add an email to send a portal invitation.',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Send portal invitation to ${contactName} (${contactEmail})?`)) return;

    setInviting(true);
    try {
      const res = await apiPost<{ portal_project_id: string; invitation_sent: boolean }>(
        '/api/portal/invite',
        { contact_id: contactId }
      );
      toast({
        title: 'Invitation sent',
        description: `Portal invitation sent to ${contactEmail}`,
      });
      onInviteSent?.();

      // Navigate to the created/linked portal project
      if (res.data.portal_project_id) {
        router.push(`/portal/projects/${res.data.portal_project_id}`);
      }
    } catch (err) {
      toast({
        title: 'Failed to send invitation',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setInviting(false);
    }
  }

  if (hasPortalProject) {
    return (
      <Button
        variant="outline"
        onClick={() => router.push(`/portal/projects/${portalProjects[0].id}`)}
      >
        <ExternalLink className="mr-2 h-4 w-4" />
        Open Portal
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={handleInvite}
      disabled={inviting || !contactEmail}
    >
      {inviting ? (
        <CcdSpinner size="sm" className="mr-2" />
      ) : (
        <Send className="mr-2 h-4 w-4" />
      )}
      Invite to Portal
    </Button>
  );
}
