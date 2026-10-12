"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  const router = useRouter()
  // The landing page's hero email pill hands off here with ?email=…&mode=signup.
  const params = use(searchParams)
  const [mode, setMode] = useState<"sign_in" | "sign_up">(params.mode === "signup" ? "sign_up" : "sign_in")
  const [email, setEmail] = useState(typeof params.email === "string" ? params.email : "")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmSent, setConfirmSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setConfirmSent(false)
    const supabase = createBrowserSupabaseClient()

    if (mode === "sign_up") {
      const { data, error } = await supabase.auth.signUp({ email, password })
      setLoading(false)
      if (error) return setError(error.message)
      if (data.session) return router.push("/dashboard")
      // No session back means email confirmation is required before sign-in works.
      setConfirmSent(true)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) return setError(error.message)
    router.push("/dashboard")
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-neutral-900">
          {mode === "sign_in" ? "Log in" : "Create an account"}
        </h1>
        <p className="text-sm text-neutral-500">
          {mode === "sign_in"
            ? "Sign in to save call transcripts and sync your sales materials."
            : "Sign up to start saving call transcripts."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}
        {confirmSent && (
          <p className="text-sm text-emerald-700">
            Check your email to confirm your account, then come back and log in.
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {loading ? "Working…" : mode === "sign_in" ? "Log in" : "Sign up"}
        </button>
      </form>

      <button
        onClick={() => {
          setMode(mode === "sign_in" ? "sign_up" : "sign_in")
          setError(null)
          setConfirmSent(false)
        }}
        className="text-sm text-neutral-500 hover:text-neutral-700"
      >
        {mode === "sign_in" ? "Need an account? Sign up" : "Already have an account? Log in"}
      </button>
    </div>
  )
}
