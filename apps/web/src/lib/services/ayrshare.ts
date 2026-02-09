import type {
  AyrsharePostResponse,
  AyrshareCreateProfileResponse,
  AyrshareJwtResponse,
  AyrshareProfileResponse,
  AyrshareDeleteProfileResponse,
  AyrsharePostAnalyticsResponse,
  AyrshareCommentsResponse,
  AyrshareReplyResponse,
  AyrshareAccountAnalyticsResponse,
} from './ayrshare-types';

// ── Ayrshare REST API Client ────────────────────────────────────────

const BASE_URL = 'https://api.ayrshare.com/api';

function getApiKey(): string {
  const key = process.env.AYRSHARE_API_KEY;
  if (!key) throw new Error('AYRSHARE_API_KEY is not configured');
  return key;
}

function headers(profileKey?: string): Record<string, string> {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getApiKey()}`,
  };
  if (profileKey) h['Profile-Key'] = profileKey;
  return h;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  profileKey?: string
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const opts: RequestInit = {
    method,
    headers: headers(profileKey),
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  const json = await res.json().catch(() => ({ status: 'error', errors: [{ code: res.status, message: res.statusText }] }));

  if (!res.ok && !json.status) {
    throw new Error(`Ayrshare API error ${res.status}: ${res.statusText}`);
  }

  return json as T;
}

// ── Profiles (multi-tenant) ─────────────────────────────────────────

/** Create a new Ayrshare profile for a tenant */
export async function createProfile(title: string): Promise<AyrshareCreateProfileResponse> {
  return request<AyrshareCreateProfileResponse>('POST', '/profiles', { title });
}

/** Generate a JWT link URL for a user to connect their social accounts */
export async function generateLinkUrl(
  profileKey: string,
  opts?: { redirectUrl?: string; allowedSocial?: string[] }
): Promise<AyrshareJwtResponse> {
  const domain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost';
  return request<AyrshareJwtResponse>('POST', '/profiles/generateJWT', {
    domain,
    profileKey,
    privateKey: process.env.AYRSHARE_API_KEY,
    ...(opts?.redirectUrl && { redirect: opts.redirectUrl }),
    ...(opts?.allowedSocial && { allowedSocial: opts.allowedSocial }),
  });
}

/** Get profile details (connected platforms, display names) */
export async function getProfile(profileKey: string): Promise<AyrshareProfileResponse> {
  return request<AyrshareProfileResponse>('GET', `/profiles/${profileKey}`, undefined, profileKey);
}

/** Delete / unlink a profile */
export async function deleteProfile(profileKey: string): Promise<AyrshareDeleteProfileResponse> {
  return request<AyrshareDeleteProfileResponse>('DELETE', `/profiles/${profileKey}`);
}

// ── Publishing ──────────────────────────────────────────────────────

/** Publish a post to one or more platforms */
export async function publishPost(params: {
  post: string;
  platforms: string[];
  mediaUrls?: string[];
  scheduleDate?: string; // ISO 8601 UTC
  profileKey?: string;
}): Promise<AyrsharePostResponse> {
  const body: Record<string, unknown> = {
    post: params.post,
    platforms: params.platforms,
  };
  if (params.mediaUrls?.length) body.mediaUrls = params.mediaUrls;
  if (params.scheduleDate) body.scheduleDate = params.scheduleDate;

  return request<AyrsharePostResponse>('POST', '/post', body, params.profileKey);
}

/** Delete a published post from Ayrshare */
export async function deletePost(
  ayrshareId: string,
  profileKey?: string
): Promise<{ status: string }> {
  return request<{ status: string }>('DELETE', '/post', { id: ayrshareId }, profileKey);
}

// ── Analytics ───────────────────────────────────────────────────────

/** Get analytics for a specific Ayrshare post */
export async function getPostAnalytics(
  ayrshareId: string,
  platforms?: string[],
  profileKey?: string
): Promise<AyrsharePostAnalyticsResponse> {
  const body: Record<string, unknown> = { id: ayrshareId };
  if (platforms?.length) body.platforms = platforms;
  return request<AyrsharePostAnalyticsResponse>('POST', '/analytics/post', body, profileKey);
}

/** Get account-level analytics for social networks */
export async function getAccountAnalytics(
  platforms: string[],
  profileKey?: string
): Promise<AyrshareAccountAnalyticsResponse> {
  return request<AyrshareAccountAnalyticsResponse>(
    'POST',
    '/analytics/social',
    { platforms },
    profileKey
  );
}

// ── Comments ────────────────────────────────────────────────────────

/** Get comments for a post */
export async function getComments(
  ayrshareId: string,
  profileKey?: string
): Promise<AyrshareCommentsResponse> {
  return request<AyrshareCommentsResponse>('GET', `/comments/${ayrshareId}`, undefined, profileKey);
}

/** Reply to a comment on a post */
export async function replyToComment(params: {
  id: string; // Ayrshare post ID
  comment: string;
  platforms: string[];
  profileKey?: string;
}): Promise<AyrshareReplyResponse> {
  return request<AyrshareReplyResponse>(
    'POST',
    '/comments',
    { id: params.id, comment: params.comment, platforms: params.platforms },
    params.profileKey
  );
}

// ── Helpers ─────────────────────────────────────────────────────────

/** Check if Ayrshare is configured */
export function isConfigured(): boolean {
  return !!process.env.AYRSHARE_API_KEY;
}

/** Map CCD platform names to Ayrshare platform names (currently 1:1) */
export function mapPlatform(platform: string): string {
  return platform; // facebook, instagram, twitter, linkedin, tiktok, youtube all match
}
