"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useUser } from "@/hooks/useUser"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"

interface Transcript {
  id: string
  transcript: string
  summary: string | null
  next_steps: string | null
  sentiment: "positive" | "neutral" | "negative" | null
  created_at: string
}

interface ObjectionSummaryRow {
  category: string
  total: number
  handledWellRate: number
  examples: string[]
}

const SENTIMENT_STYLES: Record<string, string> = {
  positive: "bg-emerald-100 text-emerald-800",
  neutral: "bg-neutral-100 text-neutral-700",
  negative: "bg-red-100 text-red-800",
}

export default function CallsPage() {
  const router = useRouter()
  const { session, user, loading: userLoading } = useUser()
  const [transcripts, setTranscripts] = useState<Transcript[]>([])
  const [objectionSummary, setObjectionSummary] = useState<ObjectionSummaryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    if (userLoading) return
    if (!session) {
      router.push("/login")
      return
    }
    const headers = { Authorization: `Bearer ${session.access_token}` }
    Promise.all([
      fetch("/api/transcripts", { headers }).then((res) => res.json()),
      fetch("/api/objections/summary", { headers }).then((res) => res.json()),
    ])
      .then(([transcriptsData, summaryData]) => {
        setTranscripts(transcriptsData.transcripts ?? [])
        setObjectionSummary(summaryData.summary ?? [])
      })
      .finally(() => setLoading(false))
  }, [session, userLoading, router])

  async function handleSignOut() {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (userLoading || !session) {
    return <div className="p-8 text-sm text-neutral-500">Loading…</div>
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-16">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-700">
            ← Back
          </Link>
          <h1 className="text-2xl font-semibold text-neutral-900">Saved calls</h1>
          <p className="text-sm text-neutral-500">Signed in as {user?.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="h-fit rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100"
        >
          Sign out
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : (
        <>
          {objectionSummary.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-neutral-900">Objection patterns</h2>
              <p className="text-sm text-neutral-500">
                Across every saved call — where the tricky moments actually are, and how often they're
                being handled well.
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {objectionSummary.map((row) => (
                  <div key={row.category} className="rounded-lg border border-neutral-200 bg-white p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                      {row.category}
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-neutral-900">{row.total}</p>
                    <p className="text-xs text-neutral-500">{row.handledWellRate}% handled well</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-neutral-900">Calls</h2>
            {transcripts.length === 0 ? (
              <p className="text-sm text-neutral-500">
                No saved calls yet. Transcripts save automatically when you stop listening in the extension
                while signed in.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {transcripts.map((t) => {
                  const isOpen = openId === t.id
                  return (
                    <li key={t.id} className="rounded-lg border border-neutral-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-neutral-400">
                          {new Date(t.created_at).toLocaleString()}
                        </span>
                        {t.sentiment && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${SENTIMENT_STYLES[t.sentiment] ?? SENTIMENT_STYLES.neutral}`}
                          >
                            {t.sentiment}
                          </span>
                        )}
                      </div>

                      {t.summary ? (
                        <div className="mt-2 flex flex-col gap-2">
                          <p className="text-sm text-neutral-800">{t.summary}</p>
                          {t.next_steps && (
                            <p className="text-sm text-neutral-600">
                              <span className="font-medium text-neutral-700">Next steps: </span>
                              {t.next_steps}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm italic text-neutral-400">
                          Recap still generating — check back in a moment.
                        </p>
                      )}

                      <button
                        onClick={() => setOpenId(isOpen ? null : t.id)}
                        className="mt-2 text-xs font-medium text-neutral-500 hover:text-neutral-700"
                      >
                        {isOpen ? "Hide full transcript" : "View full transcript"}
                      </button>
                      {isOpen && (
                        <p className="mt-2 whitespace-pre-wrap rounded-lg bg-neutral-50 p-3 text-xs text-neutral-600">
                          {t.transcript}
                        </p>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
