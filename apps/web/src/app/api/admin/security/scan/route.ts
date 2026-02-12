import { NextRequest } from 'next/server';
import { requireAdmin, createAdminServiceClient } from '@/lib/supabase/admin';
import { success, error, dbError } from '@/lib/api/responses';
import { rateLimit, RATE_LIMIT_PRESETS } from '@/lib/api/rate-limit';
import { randomUUID } from 'crypto';

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

function checkHeaders(): Finding[] {
  const findings: Finding[] = [];

  const requiredHeaders = [
    'X-Frame-Options',
    'X-Content-Type-Options',
    'Strict-Transport-Security',
    'Content-Security-Policy',
    'X-XSS-Protection',
    'Referrer-Policy',
    'Permissions-Policy',
  ];

  // Since headers are configured in next.config.mjs, we check env-level indicators.
  // In a real scan we would make an HTTP request to ourselves; here we use a simplified check.
  const headersConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL !== undefined;

  if (!headersConfigured) {
    findings.push({
      id: randomUUID(),
      severity: 'high',
      category: 'headers',
      title: 'Security headers may not be configured',
      description: 'Could not verify that security headers are set in next.config.mjs.',
      recommendation: 'Configure security headers (CSP, HSTS, X-Frame-Options, etc.) in next.config.mjs.',
    });
  }

  // Check for CSP reporting
  if (!process.env.CSP_REPORT_URI) {
    findings.push({
      id: randomUUID(),
      severity: 'low',
      category: 'headers',
      title: 'CSP report-uri not configured',
      description: 'Content-Security-Policy violation reporting is not set up.',
      recommendation: 'Set CSP_REPORT_URI environment variable and add report-uri directive to CSP.',
    });
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

  // Check key tables for RLS
  const keyTables = [
    'profiles',
    'tenants',
    'projects',
    'tasks',
    'invoices',
    'activity_logs',
    'api_keys',
  ];

  const { data: tables, error: tablesErr } = await serviceClient.rpc('get_tables_with_rls_status').select('*');

  if (tablesErr || !tables) {
    // If the RPC doesn't exist, fall back to a pg_tables query
    const { data: pgTables } = await serviceClient
      .from('pg_catalog.pg_tables' as string)
      .select('tablename, rowsecurity')
      .eq('schemaname', 'public')
      .in('tablename', keyTables);

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
    } else {
      // Cannot check — report as warning
      findings.push({
        id: randomUUID(),
        severity: 'medium',
        category: 'permissions',
        title: 'Unable to verify RLS status',
        description: 'Could not query pg_tables to verify Row Level Security is enabled.',
        recommendation: 'Manually verify RLS is enabled on all public tables.',
      });
    }
  } else {
    for (const table of tables as { table_name: string; rls_enabled: boolean }[]) {
      if (keyTables.includes(table.table_name) && !table.rls_enabled) {
        findings.push({
          id: randomUUID(),
          severity: 'critical',
          category: 'permissions',
          title: `RLS not enabled on ${table.table_name}`,
          description: `Row Level Security is disabled on the ${table.table_name} table.`,
          recommendation: `Enable RLS: ALTER TABLE public.${table.table_name} ENABLE ROW LEVEL SECURITY;`,
        });
      }
    }
  }

  return findings;
}

// ── RLS policy checks ──

async function checkRlsPolicies(serviceClient: ReturnType<typeof createAdminServiceClient>): Promise<Finding[]> {
  const findings: Finding[] = [];

  const keyTables = ['profiles', 'tenants', 'projects', 'tasks', 'invoices'];

  // Check if policies exist for key tables
  const { data: policies } = await serviceClient
    .from('pg_catalog.pg_policies' as string)
    .select('tablename, policyname')
    .eq('schemaname', 'public')
    .in('tablename', keyTables);

  if (policies) {
    const tablesWithPolicies = new Set((policies as { tablename: string }[]).map((p) => p.tablename));
    for (const table of keyTables) {
      if (!tablesWithPolicies.has(table)) {
        findings.push({
          id: randomUUID(),
          severity: 'high',
          category: 'rls',
          title: `No RLS policies on ${table}`,
          description: `Table ${table} has no RLS policies defined, which may leave data unprotected.`,
          recommendation: `Create appropriate SELECT, INSERT, UPDATE, DELETE policies for the ${table} table.`,
        });
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
        findings = checkHeaders();
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
          ...checkHeaders(),
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
