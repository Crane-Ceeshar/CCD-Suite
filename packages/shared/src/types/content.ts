export type ContentType = 'article' | 'blog_post' | 'social_post' | 'email' | 'landing_page' | 'ad_copy' | 'video_script';
export type ContentStatus = 'draft' | 'review' | 'approved' | 'scheduled' | 'published' | 'archived';

export interface ContentCategory {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  color: string | null;
  created_at: string;
}

export interface ContentItem {
  id: string;
  tenant_id: string;
  category_id: string | null;
  title: string;
  slug: string;
  content_type: ContentType;
  body: string | null;
  excerpt: string | null;
  status: ContentStatus;
  publish_date: string | null;
  platforms: string[];
  tags: string[];
  seo_title: string | null;
  seo_description: string | null;
  featured_image_url: string | null;
  metadata: Record<string, unknown>;
  author_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  category?: ContentCategory;
}

export interface ContentAsset {
  id: string;
  tenant_id: string;
  content_item_id: string | null;
  file_name: string;
  file_type: string;
  file_size: number;
  url: string;
  thumbnail_url: string | null;
  alt_text: string | null;
  metadata: Record<string, unknown>;
  uploaded_by: string | null;
  created_at: string;
}

export interface ContentApproval {
  id: string;
  content_item_id: string;
  reviewer_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  comments: string | null;
  created_at: string;
}
