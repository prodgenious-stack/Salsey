import { SUPABASE_ANON_KEY, SUPABASE_URL, type AuthSession } from "./types"
import { getAuthSession, setAuthSession } from "./storage"

interface GoTrueTokenResponse {
  access_token?: string
  refresh_token?: string
  expires_at?: number
  user?: { email?: string }
  error_description?: string
  msg?: string
  error?: string
}

function toAuthSession(data: GoTrueTokenResponse): AuthSession {
  return {
    accessToken: data.access_token!,
    refreshToken: data.refresh_token!,
    expiresAt: data.expires_at!,
    email: data.user?.email ?? "",
  }
}

async function gotrueFetch(path: string, body: Record<string, unknown>): Promise<GoTrueTokenResponse> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1${path}`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as GoTrueTokenResponse
  if (!res.ok) {
    throw new Error(data.error_description || data.msg || data.error || `Auth request failed (${res.status})`)
  }
  return data
}

// Returns null if the account was created but needs email confirmation before it has a session.
export async function signUp(email: string, password: string): Promise<AuthSession | null> {
  const data = await gotrueFetch("/signup", { email, password })
  if (!data.access_token) return null
  const session = toAuthSession(data)
  await setAuthSession(session)
  return session
}

export async function signIn(email: string, password: string): Promise<AuthSession> {
  const data = await gotrueFetch("/token?grant_type=password", { email, password })
  const session = toAuthSession(data)
  await setAuthSession(session)
  return session
}

export async function signOut(): Promise<void> {
  await setAuthSession(null)
}

// Returns a valid access token, transparently refreshing it if it's expired or about to be —
// or null if there's no session at all. Callers should treat null as "not signed in."
export async function getValidAccessToken(): Promise<string | null> {
  const session = await getAuthSession()
  if (!session) return null

  const now = Math.floor(Date.now() / 1000)
  if (session.expiresAt - now > 30) return session.accessToken

  try {
    const data = await gotrueFetch("/token?grant_type=refresh_token", { refresh_token: session.refreshToken })
    const refreshed = toAuthSession(data)
    await setAuthSession(refreshed)
    return refreshed.accessToken
  } catch {
    // Refresh token is dead — the user needs to sign in again.
    await setAuthSession(null)
    return null
  }
}
