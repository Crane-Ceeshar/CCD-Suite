export type PortalProjectStatus = 'active' | 'completed' | 'on_hold';
export type MilestoneStatus = 'upcoming' | 'in_progress' | 'completed' | 'overdue';
export type DeliverableStatus = 'pending_review' | 'approved' | 'revision_requested' | 'delivered';

export interface PortalProject {
  id: string;
  tenant_id: string;
  project_id: string | null;
  client_id: string | null;
  name: string;
  description: string | null;
  status: PortalProjectStatus;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  progress: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined
  milestones?: PortalMilestone[];
  deliverables?: PortalDeliverable[];
}

export interface PortalMilestone {
  id: string;
  portal_project_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: MilestoneStatus;
  position: number;
  completed_at: string | null;
  created_at: string;
}

export interface PortalDeliverable {
  id: string;
  tenant_id: string;
  portal_project_id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  status: DeliverableStatus;
  feedback: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PortalMessage {
  id: string;
  tenant_id: string;
  portal_project_id: string;
  sender_id: string;
  content: string;
  attachments: Record<string, unknown>[];
  is_internal: boolean;
  created_at: string;
}

export interface PortalAccessToken {
  id: string;
  tenant_id: string;
  client_email: string;
  token_hash: string;
  portal_project_id: string | null;
  expires_at: string;
  used_at: string | null;
  created_by: string | null;
  created_at: string;
}

export interface CreatePortalProjectInput {
  name: string;
  project_id?: string;
  client_id?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
}

export interface CreateDeliverableInput {
  title: string;
  description?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
}

export interface CreateMessageInput {
  content: string;
  attachments?: Record<string, unknown>[];
  is_internal?: boolean;
}
