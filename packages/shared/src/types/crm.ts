export interface Company {
  id: string;
  tenant_id: string;
  name: string;
  industry: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  notes: string | null;
  status: 'active' | 'inactive' | 'prospect';
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  tenant_id: string;
  company_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  avatar_url: string | null;
  status: 'active' | 'inactive' | 'lead';
  notes: string | null;
  website: string | null;
  lead_source: string | null;
  lead_status: string | null;
  qualification: string | null;
  priority: string | null;
  comment: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  company?: Company;
}

export type LeadSource = 'website' | 'referral' | 'social_media' | 'cold_call' | 'email_campaign' | 'event' | 'other';
export type LeadStatus = 'new_lead' | 'attempted_to_contact' | 'contacted' | 'closed';
export type Qualification = 'qualified' | 'unqualified' | 'pending';

export interface Pipeline {
  id: string;
  tenant_id: string;
  name: string;
  is_default: boolean;
  created_at: string;
  stages?: PipelineStage[];
}

export interface PipelineStage {
  id: string;
  pipeline_id: string;
  name: string;
  position: number;
  color: string | null;
  probability: number | null;
  created_at: string;
  deals?: Deal[];
}

export interface Deal {
  id: string;
  tenant_id: string;
  pipeline_id: string;
  stage_id: string;
  company_id: string | null;
  contact_id: string | null;
  title: string;
  value: number;
  currency: string;
  status: 'open' | 'won' | 'lost';
  expected_close_date: string | null;
  actual_close_date: string | null;
  notes: string | null;
  position: number;
  metadata: Record<string, unknown>;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  company?: Company;
  contact?: Contact;
  stage?: PipelineStage;
}

export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'task';

export interface Activity {
  id: string;
  tenant_id: string;
  deal_id: string | null;
  contact_id: string | null;
  company_id: string | null;
  type: ActivityType;
  title: string;
  description: string | null;
  scheduled_at: string | null;
  completed_at: string | null;
  is_completed: boolean;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
}

export interface CreateDealInput {
  pipeline_id: string;
  stage_id: string;
  title: string;
  value?: number;
  currency?: string;
  company_id?: string;
  contact_id?: string;
  expected_close_date?: string;
  notes?: string;
  assigned_to?: string;
}

export interface UpdateDealInput {
  stage_id?: string;
  title?: string;
  value?: number;
  status?: 'open' | 'won' | 'lost';
  expected_close_date?: string;
  notes?: string;
  position?: number;
  assigned_to?: string;
}

export interface CreateCompanyInput {
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  notes?: string;
}

export interface CreateContactInput {
  first_name: string;
  last_name: string;
  company_id?: string;
  email?: string;
  phone?: string;
  job_title?: string;
  notes?: string;
}
