"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useUser } from "@/hooks/useUser"

export interface Transcript {
  id: string
  transcript: string
  summary: string | null
  next_steps: string | null
  sentiment: "positive" | "neutral" | "negative" | null
  company: string | null
  contact_name: string | null
  created_at: string
  objection_categories: string[]
}

export interface ObjectionExample {
  quote: string
  company: string | null
  handledWell: boolean
}

export interface ObjectionSummaryRow {
  category: string
  total: number
  handledWellRate: number
  examples: ObjectionExample[]
}

export interface Insight {
  title: string
  body: string
}

interface DashboardDataValue {
  transcripts: Transcript[]
  objectionSummary: ObjectionSummaryRow[]
  loading: boolean
  error: string | null
  session: ReturnType<typeof useUser>["session"]
}

const DashboardDataContext = createContext<DashboardDataValue>({
  transcripts: [],
  objectionSummary: [],
  loading: true,
  error: null,
  session: null,
})

// Fetched once per dashboard visit and shared — the sidebar's call-count badge and every
// page under /dashboard used to each fetch this independently (confirmed via network
// trace: /api/transcripts was firing twice on a single page load). One fetch, read
// everywhere.
export function DashboardDataProvider({ children }: { children: React.ReactNode }) {
  const { session, loading: userLoading } = useUser()
  const [transcripts, setTranscripts] = useState<Transcript[]>([])
  const [objectionSummary, setObjectionSummary] = useState<ObjectionSummaryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (userLoading) return
    if (!session) {
      setLoading(false)
      return
    }
    const headers = { Authorization: `Bearer ${session.access_token}` }
    setLoading(true)
    Promise.all([
      fetch("/api/transcripts", { headers }).then((res) => res.json()),
      fetch("/api/objections/summary", { headers }).then((res) => res.json()),
    ])
      .then(([t, o]) => {
        if (t.error || o.error) {
          setError(t.error || o.error)
          return
        }
        setTranscripts(t.transcripts ?? [])
        setObjectionSummary(o.summary ?? [])
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false))
  }, [session, userLoading])

  return (
    <DashboardDataContext.Provider value={{ transcripts, objectionSummary, loading: loading || userLoading, error, session }}>
      {children}
    </DashboardDataContext.Provider>
  )
}

export function useDashboardData() {
  return useContext(DashboardDataContext)
}
