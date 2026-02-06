export type SeoProjectStatus = 'active' | 'paused' | 'completed';
export type AuditStatus = 'running' | 'completed' | 'failed';
export type KeywordStatus = 'tracking' | 'paused' | 'achieved';
export type BacklinkStatus = 'active' | 'lost' | 'pending';
export type RecommendationType = 'technical' | 'content' | 'on_page' | 'off_page' | 'performance';
export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';
export type RecommendationStatus = 'open' | 'in_progress' | 'done' | 'dismissed';
export type SearchEngine = 'google' | 'bing' | 'yahoo';

export interface SeoProject {
  id: string;
  tenant_id: string;
  name: string;
  domain: string;
  description: string | null;
  status: SeoProjectStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  latest_audit?: SeoAudit;
  keywords?: SeoKeyword[];
}

export interface SeoAudit {
  id: string;
  tenant_id: string;
  project_id: string;
  score: number | null;
  issues_count: number;
  pages_crawled: number;
  status: AuditStatus;
  results: Record<string, unknown>;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface SeoKeyword {
  id: string;
  tenant_id: string;
  project_id: string;
  keyword: string;
  search_volume: number | null;
  difficulty: number | null;
  current_rank: number | null;
  previous_rank: number | null;
  target_rank: number | null;
  url: string | null;
  status: KeywordStatus;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined
  rank_history?: RankHistory[];
}

export interface RankHistory {
  id: string;
  keyword_id: string;
  rank: number;
  date: string;
  search_engine: SearchEngine;
  created_at: string;
}

export interface Backlink {
  id: string;
  tenant_id: string;
  project_id: string;
  source_url: string;
  target_url: string;
  anchor_text: string | null;
  domain_authority: number | null;
  status: BacklinkStatus;
  discovered_at: string;
  created_at: string;
}

export interface SeoRecommendation {
  id: string;
  tenant_id: string;
  project_id: string;
  audit_id: string | null;
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  description: string | null;
  status: RecommendationStatus;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSeoProjectInput {
  name: string;
  domain: string;
  description?: string;
}

export interface CreateKeywordInput {
  keyword: string;
  search_volume?: number;
  difficulty?: number;
  target_rank?: number;
  url?: string;
  tags?: string[];
}

export interface CreateAuditInput {
  project_id: string;
}
