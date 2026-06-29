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

// Browser-side singleton (used in Client Components)
let browserClient: ReturnType<typeof createClient> | null = null
export function createBrowserClient() {
  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return browserClient
}
