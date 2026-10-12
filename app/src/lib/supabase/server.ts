import { createClient } from "@supabase/supabase-js"

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Server-only — the service role key bypasses row-level security. Never import
// this from a client component or expose it to the extension/browser.
export function createServiceSupabaseClient() {
  if (!URL || !SERVICE_ROLE_KEY) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local")
  }
  return createClient(URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// Verifies a bearer token from the extension/client and returns the authenticated user, or null.
export async function getUserFromAuthHeader(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) return null
  const token = authHeader.slice("Bearer ".length)
  const supabase = createServiceSupabaseClient()
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null
  return data.user
}
