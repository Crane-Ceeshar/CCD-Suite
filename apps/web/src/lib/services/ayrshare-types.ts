// ── Ayrshare API Response Types ─────────────────────────────────────

/** Response from POST /api/post */
export interface AyrsharePostResponse {
  status: 'success' | 'scheduled' | 'error';
  id?: string; // Ayrshare post ID
  postIds?: AyrsharePostId[];
  errors?: AyrshareError[];
  scheduleDate?: string;
  refId?: string;
}

export interface AyrsharePostId {
  status: string;
  id: string; // Platform-specific post ID
  platform: string;
  postUrl?: string;
}

export interface AyrshareError {
  code: number;
  message: string;
  platform?: string;
}

/** Response from POST /api/profiles (create profile) */
export interface AyrshareCreateProfileResponse {
  status: 'success' | 'error';
  title: string;
  refId?: string;
  profileKey?: string;
  errors?: AyrshareError[];
}

/** Response from POST /api/profiles/generateJWT */
export interface AyrshareJwtResponse {
  status: 'success' | 'error';
  url?: string;
  token?: string;
  errors?: AyrshareError[];
}

/** Response from GET /api/profiles/:profileKey */
export interface AyrshareProfileResponse {
  status?: string;
  title?: string;
  activeSocialAccounts?: string[];
  displayNames?: Record<string, string>;
  created?: string;
  refId?: string;
  errors?: AyrshareError[];
}

/** Response from DELETE /api/profiles/:profileKey */
export interface AyrshareDeleteProfileResponse {
  status: 'success' | 'error';
  errors?: AyrshareError[];
}

/** POST /api/analytics/post response per platform */
export interface AyrsharePostAnalyticsResponse {
  [platform: string]: {
    id?: string;
    postUrl?: string;
    analytics?: AyrsharePostMetrics;
    lastUpdated?: string;
    nextUpdate?: string;
    status?: string;
    errors?: AyrshareError[];
  };
}

export interface AyrsharePostMetrics {
  likeCount?: number;
  commentCount?: number;
  sharesCount?: number;
  replyCount?: number;
  impressions?: number;
  views?: number;
  viewsCount?: number;
  reachCount?: number;
  // Many more fields vary by platform
  [key: string]: unknown;
}

/** GET /api/comments/:id response */
export interface AyrshareCommentsResponse {
  [platform: string]: AyrshareComment[] | { errors?: AyrshareError[] };
}

export interface AyrshareComment {
  comment: string;
  commentId: string;
  created: string;
  likeCount?: number;
  userName?: string;
  displayName?: string;
  platform?: string;
  replies?: AyrshareComment[];
}

/** POST /api/comments (reply) response */
export interface AyrshareReplyResponse {
  status: 'success' | 'error';
  commentID?: string;
  id?: string;
  errors?: AyrshareError[];
}

/** POST /api/analytics/social response */
export interface AyrshareAccountAnalyticsResponse {
  [platform: string]: {
    analytics?: Record<string, unknown>;
    lastUpdated?: string;
    nextUpdate?: string;
    status?: string;
    errors?: AyrshareError[];
  };
}

/** POST /api/history response (get published posts) */
export interface AyrshareHistoryResponse {
  status?: string;
  posts?: AyrshareHistoryPost[];
  errors?: AyrshareError[];
}

export interface AyrshareHistoryPost {
  id: string;
  post: string;
  platforms: string[];
  postIds?: AyrsharePostId[];
  created: string;
  status: string;
}
