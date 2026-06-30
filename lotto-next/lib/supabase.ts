import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Server-side client (used in Server Components and API routes)
// Not cached — each call returns a fresh client suitable for server context.
export function createServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  })
}

// Admin client — uses the service_role key, which bypasses RLS and holds
// write access. SERVER-ONLY: used by the sync route (and the local seed
// script). Never import this into a Client Component or expose the key to
// the browser.
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })
}

// Browser-side singleton (used in Client Components)
let browserClient: ReturnType<typeof createClient> | null = null
export function createBrowserClient() {
  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return browserClient
}
