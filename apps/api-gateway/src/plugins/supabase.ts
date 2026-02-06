import fp from 'fastify-plugin';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { FastifyInstance } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    supabase: SupabaseClient;
  }
}

async function supabase(fastify: FastifyInstance) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    fastify.log.warn(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — Supabase client not initialised. ' +
      'Health endpoint will still respond but all authenticated routes will fail.'
    );
    fastify.decorate('supabase', null as unknown as SupabaseClient);
    return;
  }

  const client = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  fastify.decorate('supabase', client);
}

export const supabasePlugin = fp(supabase, {
  name: 'supabase',
});
