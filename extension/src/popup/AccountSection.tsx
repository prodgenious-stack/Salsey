import { useEffect, useState } from "react"
import { getAuthSession } from "../shared/storage"
import { signIn, signOut, signUp } from "../shared/supabase-auth"
import type { AuthSession } from "../shared/types"

export default function AccountSection() {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [mode, setMode] = useState<"sign_in" | "sign_up">("sign_in")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmSent, setConfirmSent] = useState(false)

  useEffect(() => {
    getAuthSession().then((s) => {
      setSession(s)
      setLoaded(true)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setConfirmSent(false)
    try {
      if (mode === "sign_up") {
        const newSession = await signUp(email, password)
        if (!newSession) {
          setConfirmSent(true)
        } else {
          setSession(newSession)
        }
      } else {
        const newSession = await signIn(email, password)
        setSession(newSession)
      }
      setPassword("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    await signOut()
    setSession(null)
  }

  if (!loaded) return null

  if (session) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Signed in</p>
          <p className="text-sm text-neutral-900">{session.email}</p>
        </div>
        <button onClick={handleSignOut} className="text-xs font-medium text-neutral-500 hover:text-neutral-700">
          Sign out
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-3">
      <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        {mode === "sign_in" ? "Sign in to save call transcripts" : "Create an account"}
      </label>
      <input
        type="email"
        required
        placeholder="you@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded-lg border border-neutral-200 px-2 py-1.5 text-sm focus:border-neutral-400 focus:outline-none"
      />
      <input
        type="password"
        required
        minLength={6}
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="rounded-lg border border-neutral-200 px-2 py-1.5 text-sm focus:border-neutral-400 focus:outline-none"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {confirmSent && <p className="text-xs text-emerald-700">Check your email to confirm, then sign in here.</p>}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            setMode(mode === "sign_in" ? "sign_up" : "sign_in")
            setError(null)
            setConfirmSent(false)
          }}
          className="text-xs text-neutral-500 hover:text-neutral-700"
        >
          {mode === "sign_in" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {loading ? "Working…" : mode === "sign_in" ? "Sign in" : "Sign up"}
        </button>
      </div>
    </form>
  )
}
