import { createClient } from '@/lib/supabase/client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function apiGet<T = unknown>(path: string): Promise<{ success: boolean; data: T }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(err.error?.message ?? 'Request failed');
  }
  return res.json();
}

export async function apiPost<T = unknown>(
  path: string,
  body: unknown
): Promise<{ success: boolean; data: T }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(err.error?.message ?? 'Request failed');
  }
  return res.json();
}

export async function apiPatch<T = unknown>(
  path: string,
  body: unknown
): Promise<{ success: boolean; data: T }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(err.error?.message ?? 'Request failed');
  }
  return res.json();
}

export async function apiDelete(path: string): Promise<{ success: boolean }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(err.error?.message ?? 'Request failed');
  }
  return res.json();
}

export async function apiStream(
  path: string,
  body: unknown,
  onText: (text: string) => void,
  onDone?: (meta: { model: string; tokens_used: number | null }) => void,
  onError?: (error: string) => void
): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const err = await res.text();
    onError?.(err);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let currentEvent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('event:')) {
        currentEvent = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        const data = line.slice(5).trim();
        if (currentEvent === 'text') {
          onText(data);
        } else if (currentEvent === 'done') {
          try {
            const meta = JSON.parse(data);
            onDone?.(meta);
          } catch { /* ignore */ }
        } else if (currentEvent === 'error') {
          onError?.(data);
        }
      }
    }
  }
}
