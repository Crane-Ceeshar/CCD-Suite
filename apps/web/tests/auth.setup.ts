import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const authFile = path.join(__dirname, '.auth', 'user.json');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ixjkcdanzqpkxpsuzxvj.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4amtjZGFuenFwa3hwc3V6eHZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNjQ2ODAsImV4cCI6MjA4NTk0MDY4MH0.owI68taUL5GxfMIAVmnU3TomPkCSh8tUG6TCPo5mIeE';

setup('authenticate', async ({ page, context }) => {
  // Step 1: Authenticate via Supabase JS from Node.js (not browser)
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'info@craneceeshar.com',
    password: 'cKsz3dxL634yYVx',
  });

  if (error || !data.session) {
    throw new Error(`Supabase auth failed: ${error?.message || 'No session returned'}`);
  }

  console.log(`[AUTH] Got session for user ${data.user.id}`);

  // Step 2: Set Supabase auth cookies in the browser context.
  // @supabase/ssr stores session data in chunked cookies.
  // The cookie name pattern is: sb-<project-ref>-auth-token
  const projectRef = SUPABASE_URL.match(/\/\/([^.]+)\./)?.[1] || '';
  const cookieBase = `sb-${projectRef}-auth-token`;

  // The session data that @supabase/ssr expects in cookies
  const sessionData = JSON.stringify({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
    expires_in: data.session.expires_in,
    token_type: data.session.token_type,
    user: data.session.user,
  });

  // @supabase/ssr chunks large cookies into 3500-byte segments
  const CHUNK_SIZE = 3500;
  const chunks: string[] = [];
  for (let i = 0; i < sessionData.length; i += CHUNK_SIZE) {
    chunks.push(sessionData.slice(i, i + CHUNK_SIZE));
  }

  const cookies = chunks.map((chunk, i) => ({
    name: chunks.length === 1 ? cookieBase : `${cookieBase}.${i}`,
    value: chunk,
    domain: 'localhost',
    path: '/',
    httpOnly: false,
    secure: false,
    sameSite: 'Lax' as const,
  }));

  await context.addCookies(cookies);

  // Step 3: Navigate to dashboard — middleware should recognize the session
  await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 30_000 });

  // Step 4: Verify we're on the dashboard
  await expect(page).toHaveURL(/\/dashboard/);

  // Save session state (cookies + localStorage)
  await page.context().storageState({ path: authFile });
});
