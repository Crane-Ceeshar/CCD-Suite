/**
 * CCD Suite — Super Admin Setup Script
 *
 * Creates the first platform super admin user.
 * This script should only be run once during initial setup.
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   npx tsx scripts/setup-admin.ts --email admin@example.com --password SecurePass123
 *
 * Or with .env file in project root:
 *   npx tsx scripts/setup-admin.ts --email admin@example.com --password SecurePass123
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ---------------------------------------------------------------------------
// Parse CLI arguments
// ---------------------------------------------------------------------------
function parseArgs(): { email: string; password: string } {
  const args = process.argv.slice(2);
  let email = '';
  let password = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) {
      email = args[++i];
    } else if (args[i] === '--password' && args[i + 1]) {
      password = args[++i];
    }
  }

  if (!email || !password) {
    console.error('\n\x1b[31mError: --email and --password are required.\x1b[0m\n');
    console.error('Usage:');
    console.error('  npx tsx scripts/setup-admin.ts --email admin@example.com --password SecurePass123\n');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('\n\x1b[31mError: Password must be at least 8 characters.\x1b[0m\n');
    process.exit(1);
  }

  return { email, password };
}

// ---------------------------------------------------------------------------
// Load environment variables from .env file (simple parser, no dependencies)
// ---------------------------------------------------------------------------
function loadEnv(): void {
  const envPaths = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), '.env.local'),
  ];

  for (const envPath of envPaths) {
    try {
      const content = readFileSync(envPath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex === -1) continue;
        const key = trimmed.slice(0, eqIndex).trim();
        let value = trimmed.slice(eqIndex + 1).trim();
        // Remove surrounding quotes
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    } catch {
      // File doesn't exist, skip
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.log('\n\x1b[36m╔══════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[36m║   CCD Suite — Super Admin Setup          ║\x1b[0m');
  console.log('\x1b[36m╚══════════════════════════════════════════╝\x1b[0m\n');

  // Load env and parse args
  loadEnv();
  const { email, password } = parseArgs();

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error('\x1b[31mError: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) is not set.\x1b[0m');
    console.error('Set it as an environment variable or in your .env file.\n');
    process.exit(1);
  }

  if (!serviceRoleKey) {
    console.error('\x1b[31mError: SUPABASE_SERVICE_ROLE_KEY is not set.\x1b[0m');
    console.error('Set it as an environment variable or in your .env file.\n');
    process.exit(1);
  }

  // Create admin Supabase client (service role bypasses RLS)
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`  Supabase URL:  ${supabaseUrl}`);
  console.log(`  Admin email:   ${email}`);
  console.log('');

  // -----------------------------------------------------------------------
  // Step 1: Check if an admin already exists
  // -----------------------------------------------------------------------
  console.log('\x1b[33m[1/4]\x1b[0m Checking for existing admin...');
  const { data: existingAdmin } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('user_type', 'admin')
    .limit(1)
    .single();

  if (existingAdmin) {
    console.error(`\n\x1b[31mError: An admin already exists (${existingAdmin.email}).\x1b[0m`);
    console.error('Only one super admin can be created with this script.\n');
    process.exit(1);
  }
  console.log('  \x1b[32m✓\x1b[0m No admin found — proceeding with setup.\n');

  // -----------------------------------------------------------------------
  // Step 2: Create or find platform tenant
  // -----------------------------------------------------------------------
  console.log('\x1b[33m[2/4]\x1b[0m Setting up platform tenant...');
  const PLATFORM_TENANT_SLUG = 'ccd-platform';

  let tenantId: string;
  const { data: existingTenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', PLATFORM_TENANT_SLUG)
    .single();

  if (existingTenant) {
    tenantId = existingTenant.id;
    console.log(`  \x1b[32m✓\x1b[0m Platform tenant already exists (${tenantId}).\n`);
  } else {
    const { data: newTenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: 'CCD Platform',
        slug: PLATFORM_TENANT_SLUG,
        plan: 'enterprise',
        max_users: 100,
        settings: {
          modules_enabled: ['crm', 'analytics', 'content', 'seo', 'social', 'client_portal', 'projects', 'finance', 'hr'],
          features: { ai_enabled: true, custom_branding: true },
        },
      })
      .select('id')
      .single();

    if (tenantError || !newTenant) {
      console.error(`\n\x1b[31mError creating tenant: ${tenantError?.message}\x1b[0m\n`);
      process.exit(1);
    }
    tenantId = newTenant.id;
    console.log(`  \x1b[32m✓\x1b[0m Platform tenant created (${tenantId}).\n`);
  }

  // -----------------------------------------------------------------------
  // Step 3: Create auth user
  // -----------------------------------------------------------------------
  console.log('\x1b[33m[3/4]\x1b[0m Creating auth user...');

  // Check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find((u) => u.email === email);

  let userId: string;

  if (existingUser) {
    userId = existingUser.id;
    console.log(`  \x1b[33m!\x1b[0m User already exists in auth (${userId}). Updating profile...\n`);

    // Update their profile to admin
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ user_type: 'admin', tenant_id: tenantId })
      .eq('id', userId);

    if (updateError) {
      console.error(`\n\x1b[31mError updating profile: ${updateError.message}\x1b[0m\n`);
      process.exit(1);
    }
  } else {
    // Create new user with metadata (the handle_new_user trigger will create the profile)
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        tenant_id: tenantId,
        user_type: 'admin',
        full_name: 'Super Admin',
      },
    });

    if (createError || !newUser.user) {
      console.error(`\n\x1b[31mError creating user: ${createError?.message}\x1b[0m\n`);
      process.exit(1);
    }
    userId = newUser.user.id;
    console.log(`  \x1b[32m✓\x1b[0m Auth user created (${userId}).\n`);
  }

  // -----------------------------------------------------------------------
  // Step 4: Verify setup
  // -----------------------------------------------------------------------
  console.log('\x1b[33m[4/4]\x1b[0m Verifying setup...');

  // Wait briefly for trigger to complete
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, user_type, tenant_id')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    console.error(`\n\x1b[31mError: Profile not found after creation. The handle_new_user trigger may have failed.\x1b[0m`);
    console.error('You may need to manually insert a profile in the Supabase dashboard.\n');
    process.exit(1);
  }

  if (profile.user_type !== 'admin') {
    // Fix it
    await supabase.from('profiles').update({ user_type: 'admin' }).eq('id', userId);
    console.log('  \x1b[33m!\x1b[0m Profile user_type was not "admin" — corrected.\n');
  } else {
    console.log('  \x1b[32m✓\x1b[0m Profile verified — user_type is "admin".\n');
  }

  // -----------------------------------------------------------------------
  // Done!
  // -----------------------------------------------------------------------
  console.log('\x1b[32m╔══════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[32m║   Super Admin Created Successfully!      ║\x1b[0m');
  console.log('\x1b[32m╚══════════════════════════════════════════╝\x1b[0m\n');
  console.log('  \x1b[1mCredentials:\x1b[0m');
  console.log(`    Email:     ${email}`);
  console.log(`    Password:  ${'*'.repeat(password.length)}`);
  console.log('');
  console.log('  \x1b[1mLogin URL:\x1b[0m');
  console.log('    http://localhost:3000/admin/login');
  console.log('    (or your deployed domain + /admin/login)');
  console.log('');
  console.log('  \x1b[90mTip: Keep your credentials safe. You can change');
  console.log('  the password from the Supabase dashboard.\x1b[0m\n');
}

main().catch((err) => {
  console.error('\n\x1b[31mUnexpected error:\x1b[0m', err.message || err);
  process.exit(1);
});
