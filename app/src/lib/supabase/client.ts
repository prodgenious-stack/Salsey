import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Singleton — every call used to construct a brand new GoTrueClient (its own storage-lock
// negotiation, its own onAuthStateChange subscription), and with several components each
// calling this independently, that meant redundant auth initialization racing on every
// dashboard page load. One client, reused, fixes that.
let client: SupabaseClient | null = null

export function createBrowserSupabaseClient() {
  if (client) return client
  if (!URL || !ANON_KEY) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local")
  }
  client = createClient(URL, ANON_KEY)
  return client
}
