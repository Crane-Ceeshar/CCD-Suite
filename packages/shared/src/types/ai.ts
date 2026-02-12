// ============================================================
// AI Module Types
// ============================================================

// --- Conversation & Messages ---

export type ConversationStatus = 'active' | 'archived';
export type MessageRole = 'user' | 'assistant' | 'system';

export interface AiConversation {
  id: string;
  tenant_id: string;
  user_id: string;
  title: string | null;
  module_context: string | null;
  status: ConversationStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined
  messages?: AiMessage[];
}

export interface AiMessage {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  tokens_used: number | null;
  model: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CreateConversationInput {
  title?: string;
  module_context?: string;
  metadata?: Record<string, unknown>;
}

// --- Content Generation ---

export type GenerationJobStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type GenerationType =
  | 'blog_post'
  | 'social_caption'
  | 'ad_copy'
  | 'email_draft'
  | 'seo_description'
  | 'summary'
  | 'custom';

export interface AiGenerationJob {
  id: string;
  tenant_id: string;
  user_id: string;
  type: GenerationType;
  prompt: string;
  result: string | null;
  status: GenerationJobStatus;
  model: string | null;
  tokens_used: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// --- AI Settings (per tenant) ---

export interface AiSettings {
  id: string;
  tenant_id: string;
  preferred_model: string;
  max_tokens_per_request: number;
  monthly_token_budget: number;
  monthly_tokens_used: number;
  features_enabled: Record<string, boolean>;
  /** Custom system prompt — brand voice, compliance rules, instructions */
  system_prompt?: string;
  /** Array of model identifiers enabled for this tenant */
  available_models?: string[];
  /** Days to retain conversations before cleanup (0 = keep forever) */
  conversation_retention_days?: number;
  /** Days to retain insights before cleanup (0 = keep forever) */
  insight_retention_days?: number;
  /** Days to retain generation jobs before cleanup (0 = keep forever) */
  generation_retention_days?: number;
  /** Timestamp of the last monthly token usage reset */
  last_token_reset_at?: string | null;
  created_at: string;
  updated_at: string;
}

// --- Insights ---

export type InsightCategory = 'crm' | 'analytics' | 'seo' | 'finance' | 'social';
export type InsightType =
  | 'deal_score'
  | 'sales_forecast'
  | 'anomaly_detection'
  | 'trend_narration'
  | 'keyword_suggestion'
  | 'expense_categorization'
  | 'sentiment_analysis'
  | 'general';

export interface AiInsight {
  id: string;
  tenant_id: string;
  category: InsightCategory;
  type: InsightType;
  title: string;
  summary: string;
  details: Record<string, unknown>;
  entity_id: string | null;
  entity_type: string | null;
  is_read: boolean;
  created_at: string;
}

// --- Automations ---

export type AutomationType =
  | 'expense_categorization'
  | 'seo_recommendations'
  | 'sentiment_analysis'
  | 'deal_scoring'
  | 'content_suggestions';

export type ScheduleType = 'manual' | 'daily' | 'weekly' | 'monthly';

export interface AiAutomation {
  id: string;
  tenant_id: string;
  type: AutomationType;
  name: string;
  description: string;
  is_enabled: boolean;
  config: Record<string, unknown>;
  schedule_type: ScheduleType;
  schedule_config: Record<string, unknown>;
  next_run_at: string | null;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export type AutomationRunStatus = 'running' | 'completed' | 'failed';

export interface AiAutomationRun {
  id: string;
  automation_id: string;
  tenant_id: string;
  status: AutomationRunStatus;
  started_at: string;
  completed_at: string | null;
  result: Record<string, unknown>;
  error_message: string | null;
  tokens_used: number;
  items_processed: number;
  created_at: string;
}

// --- Content Library ---

export interface AiContentLibraryItem {
  id: string;
  tenant_id: string;
  user_id: string;
  type: string;
  title: string;
  content: string;
  prompt: string;
  is_favorite: boolean;
  tags: string[];
  model: string | null;
  tokens_used: number | null;
  generation_job_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// --- Knowledge Base ---

export type KnowledgeBaseStatus = 'pending' | 'processing' | 'ready' | 'failed';

export interface AiKnowledgeBaseDoc {
  id: string;
  tenant_id: string;
  user_id: string;
  title: string;
  description: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string | null;
  status: KnowledgeBaseStatus;
  chunk_count: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AiEmbedding {
  id: string;
  knowledge_base_id: string;
  tenant_id: string;
  chunk_index: number;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// --- Input Types ---

export interface SendMessageInput {
  conversation_id?: string;
  content: string;
  module_context?: string;
  entity_context?: {
    entity_type: string;
    entity_id: string;
    entity_data?: Record<string, unknown>;
  };
}

export interface GenerateContentInput {
  type: GenerationType;
  prompt: string;
  context?: Record<string, unknown>;
  max_tokens?: number;
}

export interface AnalyzeTextInput {
  text: string;
  analyses: ('sentiment' | 'summary' | 'categorize' | 'keywords')[];
  context?: Record<string, unknown>;
}
