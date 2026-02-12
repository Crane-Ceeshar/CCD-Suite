import { NextRequest } from 'next/server';
import { requireAdmin, createAdminServiceClient } from '@/lib/supabase/admin';
import { success, error, dbError } from '@/lib/api/responses';
import { rateLimit, RATE_LIMIT_PRESETS } from '@/lib/api/rate-limit';
import { randomUUID } from 'crypto';
import { APP_TABLES } from '@/lib/constants/app-tables';

type ScanType = 'headers' | 'dependencies' | 'permissions' | 'rls' | 'full';
type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

interface Finding {
  id: string;
  severity: Severity;
  category: string;
  title: string;
  description: string;
  recommendation: string;
}

// ── Security header checks ──

async function checkHeaders(): Promise<Finding[]> {
  const findings: Finding[] = [];

  const requiredHeaders: Record<string, { severity: Severity; recommendation: string }> = {
    'x-frame-options': {
      severity: 'high',
      recommendation: 'Add X-Frame-Options: DENY or SAMEORIGIN to prevent clickjacking.',
    },
    'x-content-type-options': {
      severity: 'medium',
      recommendation: 'Add X-Content-Type-Options: nosniff to prevent MIME-type sniffing.',
    },
    'strict-transport-security': {
      severity: 'high',
      recommendation: 'Add Strict-Transport-Security with max-age of at least 31536000 (1 year).',
    },
    'content-security-policy': {
      severity: 'high',
      recommendation: 'Configure a Content-Security-Policy header to prevent XSS and injection attacks.',
    },
    'x-xss-protection': {
      severity: 'low',
      recommendation: 'Add X-XSS-Protection: 0 (modern approach) or 1; mode=block.',
    },
    'referrer-policy': {
      severity: 'medium',
      recommendation: 'Add Referrer-Policy: strict-origin-when-cross-origin to control referrer leakage.',
    },
    'permissions-policy': {
      severity: 'medium',
      recommendation: 'Add Permissions-Policy to restrict browser feature access (camera, microphone, etc.).',
    },
  };

  // Self-request to verify actual HTTP headers
  let headers: Headers | null = null;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || `http://localhost:${process.env.PORT || '3000'}`;
    const res = await fetch(`${baseUrl}/api/health`, { method: 'HEAD' });
    headers = res.headers;
  } catch {
    // Self-request failed — fall back to basic env check
  }

  if (headers) {
    // Verify each required header is present
    for (const [header, config] of Object.entries(requiredHeaders)) {
      const value = headers.get(header);
      if (!value) {
        findings.push({
          id: randomUUID(),
          severity: config.severity,
          category: 'headers',
          title: `Missing security header: ${header}`,
          description: `The ${header} header was not found in the HTTP response.`,
          recommendation: config.recommendation,
        });
      }
    }

    // Deep CSP analysis
    const csp = headers.get('content-security-policy');
    if (csp) {
      if (csp.includes("'unsafe-eval'")) {
        findings.push({
          id: randomUUID(),
          severity: 'high',
          category: 'headers',
          title: "CSP contains 'unsafe-eval'",
          description: "The script-src directive includes 'unsafe-eval', which allows arbitrary code execution via eval().",
          recommendation: "Remove 'unsafe-eval' from script-src. Next.js does not require it in production.",
        });
      }
      if (csp.includes("'unsafe-inline'") && csp.includes('script-src')) {
        findings.push({
          id: randomUUID(),
          severity: 'low',
          category: 'headers',
          title: "CSP script-src contains 'unsafe-inline'",
          description: "The script-src directive includes 'unsafe-inline'. While required by Next.js hydration, using nonces is preferred.",
          recommendation: "Consider migrating to nonce-based CSP for script-src when Next.js supports it.",
        });
      }
      if (!csp.includes('report-uri') && !csp.includes('report-to')) {
        findings.push({
          id: randomUUID(),
          severity: 'low',
          category: 'headers',
          title: 'CSP violation reporting not configured',
          description: 'No report-uri or report-to directive found in CSP. Violations will not be logged.',
          recommendation: 'Set CSP_REPORT_URI env var and add report-uri directive to log CSP violations.',
        });
      }
    }

    // HSTS max-age check
    const hsts = headers.get('strict-transport-security');
    if (hsts) {
      const maxAgeMatch = hsts.match(/max-age=(\d+)/);
      const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 0;
      if (maxAge < 31536000) {
        findings.push({
          id: randomUUID(),
          severity: 'medium',
          category: 'headers',
          title: 'HSTS max-age is too short',
          description: `Strict-Transport-Security max-age is ${maxAge}s (${Math.round(maxAge / 86400)} days). Recommended minimum is 1 year (31536000s).`,
          recommendation: 'Set Strict-Transport-Security max-age to at least 31536000 (1 year).',
        });
      }
    }
  } else {
    // Fallback: basic check that config exists
    const headersConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL !== undefined;
    if (!headersConfigured) {
      findings.push({
        id: randomUUID(),
        severity: 'high',
        category: 'headers',
        title: 'Security headers may not be configured',
        description: 'Could not self-check HTTP headers and environment appears unconfigured.',
        recommendation: 'Configure security headers in next.config.mjs and ensure NEXT_PUBLIC_APP_URL is set.',
      });
    } else {
      findings.push({
        id: randomUUID(),
        severity: 'info',
        category: 'headers',
        title: 'Could not verify security headers via HTTP',
        description: 'Self-request to /api/health failed. Headers could not be verified at runtime.',
        recommendation: 'Set NEXT_PUBLIC_APP_URL to enable runtime header verification during scans.',
      });
    }
  }

  return findings;
}

// ── Dependency checks ──

function checkDependencies(): Finding[] {
  const findings: Finding[] = [];

  // Simplified: in production, you would run `npm audit --json` and parse the output.
  // For now, flag that automated dependency scanning should be set up.
  findings.push({
    id: randomUUID(),
    severity: 'info',
    category: 'dependencies',
    title: 'Automated dependency scanning recommended',
    description: 'Consider running npm audit or using Dependabot for continuous monitoring.',
    recommendation: 'Set up GitHub Dependabot or Snyk for automated vulnerability scanning.',
  });

  return findings;
}

// ── Permissions / RLS checks ──

async function checkPermissions(serviceClient: ReturnType<typeof createAdminServiceClient>): Promise<Finding[]> {
  const findings: Finding[] = [];

  const { data: pgTables } = await serviceClient
    .rpc('check_rls_status', { table_names: APP_TABLES as unknown as string[] });

  if (pgTables) {
    for (const table of pgTables as { tablename: string; rowsecurity: boolean }[]) {
      if (!table.rowsecurity) {
        findings.push({
          id: randomUUID(),
          severity: 'critical',
          category: 'permissions',
          title: `RLS not enabled on ${table.tablename}`,
          description: `Row Level Security is disabled on the ${table.tablename} table, allowing unrestricted access.`,
          recommendation: `Run: ALTER TABLE public.${table.tablename} ENABLE ROW LEVEL SECURITY;`,
        });
      }
    }

    // Report coverage stats
    const checkedCount = pgTables.length;
    const expectedCount = APP_TABLES.length;
    if (checkedCount < expectedCount) {
      findings.push({
        id: randomUUID(),
        severity: 'info',
        category: 'permissions',
        title: `RLS checked on ${checkedCount}/${expectedCount} expected tables`,
        description: `${expectedCount - checkedCount} expected tables were not found in the public schema. They may not have been created yet.`,
        recommendation: 'Verify all expected tables exist after running migrations.',
      });
    }
  } else {
    findings.push({
      id: randomUUID(),
      severity: 'medium',
      category: 'permissions',
      title: 'Unable to verify RLS status',
      description: 'Could not query pg_tables to verify Row Level Security is enabled.',
      recommendation: 'Manually verify RLS is enabled on all public tables.',
    });
  }

  return findings;
}

// ── RLS policy checks ──

async function checkRlsPolicies(serviceClient: ReturnType<typeof createAdminServiceClient>): Promise<Finding[]> {
  const findings: Finding[] = [];

  const { data: policies } = await serviceClient
    .rpc('check_rls_policies', { table_names: APP_TABLES as unknown as string[] });

  if (policies) {
    type PolicyRow = { tablename: string; policyname: string; cmd: string; qual: string | null; roles: string[] | null };
    const policyRows = policies as PolicyRow[];
    const tablesWithPolicies = new Set(policyRows.map((p) => p.tablename));

    // Check for tables without any policies
    for (const table of APP_TABLES) {
      if (!tablesWithPolicies.has(table)) {
        findings.push({
          id: randomUUID(),
          severity: 'high',
          category: 'rls',
          title: `No RLS policies on ${table}`,
          description: `Table ${table} has no RLS policies defined, which may leave data unprotected even if RLS is enabled.`,
          recommendation: `Create appropriate SELECT, INSERT, UPDATE, DELETE policies for the ${table} table.`,
        });
      }
    }

    // Detect overly permissive policies: USING (true) on non-INSERT commands.
    // A policy scoped to only the "authenticated" role with USING (true) is
    // acceptable — it restricts anon access while giving all logged-in users
    // read access (common for global config tables like feature_flags).
    for (const policy of policyRows) {
      if (
        policy.qual
        && policy.qual.trim().toLowerCase() === 'true'
        && policy.cmd !== 'INSERT'
      ) {
        // Check if the policy is narrowly scoped to authenticated only
        const roles = policy.roles ?? [];
        const isAuthOnly = roles.length === 1 && roles[0] === 'authenticated';

        if (isAuthOnly) {
          // Role-scoped USING(true) is acceptable — just informational
          findings.push({
            id: randomUUID(),
            severity: 'info',
            category: 'rls',
            title: `Role-scoped open policy on ${policy.tablename}`,
            description: `Policy "${policy.policyname}" uses USING (true) for ${policy.cmd} but is restricted to the authenticated role.`,
            recommendation: `Acceptable for global config tables. Consider tenant isolation if data is tenant-specific.`,
          });
        } else {
          findings.push({
            id: randomUUID(),
            severity: 'medium',
            category: 'rls',
            title: `Overly permissive policy on ${policy.tablename}`,
            description: `Policy "${policy.policyname}" uses USING (true) for ${policy.cmd}, granting unrestricted access.`,
            recommendation: `Review and restrict the ${policy.cmd} policy on ${policy.tablename} to enforce tenant isolation or role-based access.`,
          });
        }
      }
    }
  } else {
    findings.push({
      id: randomUUID(),
      severity: 'medium',
      category: 'rls',
      title: 'Unable to verify RLS policies',
      description: 'Could not query pg_policies to verify RLS policy existence.',
      recommendation: 'Manually verify RLS policies exist on all public tables.',
    });
  }

  return findings;
}

// ── Score calculation ──

function calculateScore(findings: Finding[]): number {
  let score = 100;
  for (const finding of findings) {
    switch (finding.severity) {
      case 'critical':
        score -= 20;
        break;
      case 'high':
        score -= 15;
        break;
      case 'medium':
        score -= 10;
        break;
      case 'low':
        score -= 5;
        break;
      // 'info' does not affect score
    }
  }
  return Math.max(0, score);
}

export async function GET() {
  const { error: authErr, user, profile } = await requireAdmin();
  if (authErr) return authErr;

  const { limited, response } = rateLimit(user.id, RATE_LIMIT_PRESETS.admin);
  if (limited) return response!;

  const serviceClient = createAdminServiceClient();

  const { data: scans, error: queryErr } = await serviceClient
    .from('security_scan_results')
    .select('id, scan_type, status, score, triggered_by, started_at, completed_at')
    .eq('tenant_id', profile.tenant_id)
    .order('started_at', { ascending: false })
    .limit(50);

  if (queryErr) return dbError(queryErr, 'Failed to fetch scan history');

  return success(scans ?? []);
}

export async function POST(request: NextRequest) {
  const { error: authErr, user, profile } = await requireAdmin();
  if (authErr) return authErr;

  const { limited, response } = rateLimit(user.id, RATE_LIMIT_PRESETS.admin);
  if (limited) return response!;

  let body: { scan_type: ScanType };
  try {
    body = await request.json();
  } catch {
    return error('Invalid JSON body', 400);
  }

  const validTypes: ScanType[] = ['headers', 'dependencies', 'permissions', 'rls', 'full'];
  if (!body.scan_type || !validTypes.includes(body.scan_type)) {
    return error(`scan_type must be one of: ${validTypes.join(', ')}`, 400);
  }

  const serviceClient = createAdminServiceClient();

  // Create a scan record with status='running'
  const { data: scanRecord, error: insertErr } = await serviceClient
    .from('security_scan_results')
    .insert({
      tenant_id: profile.tenant_id,
      scan_type: body.scan_type,
      status: 'running',
      triggered_by: user.id,
      findings: [],
      score: null,
    })
    .select('*')
    .single();

  if (insertErr) return dbError(insertErr, 'Failed to create scan record');

  // Run the scan
  let findings: Finding[] = [];

  try {
    switch (body.scan_type) {
      case 'headers':
        findings = await checkHeaders();
        break;
      case 'dependencies':
        findings = checkDependencies();
        break;
      case 'permissions':
        findings = await checkPermissions(serviceClient);
        break;
      case 'rls':
        findings = await checkRlsPolicies(serviceClient);
        break;
      case 'full':
        findings = [
          ...(await checkHeaders()),
          ...checkDependencies(),
          ...(await checkPermissions(serviceClient)),
          ...(await checkRlsPolicies(serviceClient)),
        ];
        break;
    }
  } catch (scanErr) {
    // If scan fails, update record with error status
    await serviceClient
      .from('security_scan_results')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', scanRecord.id);

    return error('Scan failed during execution', 500);
  }

  const score = calculateScore(findings);

  // Update the scan record with results
  const { data: completedScan, error: updateErr } = await serviceClient
    .from('security_scan_results')
    .update({
      status: 'completed',
      findings,
      score,
      completed_at: new Date().toISOString(),
    })
    .eq('id', scanRecord.id)
    .select('*')
    .single();

  if (updateErr) return dbError(updateErr, 'Failed to update scan record');

  return success(completedScan, 201);
}
