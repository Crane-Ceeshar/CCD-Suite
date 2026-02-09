export type SocialPlatform = 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok' | 'youtube';
export type AccountStatus = 'active' | 'disconnected' | 'expired';
export type PostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';
export type Sentiment = 'positive' | 'neutral' | 'negative';

export interface SocialAccount {
  id: string;
  tenant_id: string;
  platform: SocialPlatform;
  account_name: string;
  account_id: string | null;
  avatar_url: string | null;
  status: AccountStatus;
  metadata: Record<string, unknown>;
  connected_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialPost {
  id: string;
  tenant_id: string;
  content: string | null;
  media_urls: string[];
  platforms: string[];
  scheduled_at: string | null;
  published_at: string | null;
  status: PostStatus;
  account_ids: string[];
  campaign_id: string | null;
  metadata: Record<string, unknown>;
  external_id?: string | null;
  publish_error?: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  campaign?: SocialCampaign;
  engagement?: SocialEngagement[];
}

export interface SocialCampaign {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: CampaignStatus;
  tags: string[];
  budget: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  posts?: SocialPost[];
}

export interface SocialEngagement {
  id: string;
  tenant_id: string;
  post_id: string;
  platform: string;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  reach: number;
  clicks: number;
  engagement_rate: number | null;
  recorded_at: string;
  created_at: string;
}

export interface SocialComment {
  id: string;
  tenant_id: string;
  post_id: string | null;
  platform: string;
  external_id: string | null;
  author_name: string | null;
  author_avatar: string | null;
  content: string;
  sentiment: Sentiment | null;
  replied: boolean;
  reply_content: string | null;
  metadata: Record<string, unknown>;
  posted_at: string | null;
  created_at: string;
}

export interface CreatePostInput {
  content?: string;
  media_urls?: string[];
  platforms: string[];
  scheduled_at?: string;
  account_ids?: string[];
  campaign_id?: string;
}

export interface UpdatePostInput {
  content?: string;
  media_urls?: string[];
  platforms?: string[];
  scheduled_at?: string;
  status?: PostStatus;
  campaign_id?: string;
}

export interface CreateCampaignInput {
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  tags?: string[];
  budget?: number;
}

export interface SocialProviderProfile {
  id: string;
  tenant_id: string;
  provider: string;
  profile_key: string;
  status: 'active' | 'inactive';
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
