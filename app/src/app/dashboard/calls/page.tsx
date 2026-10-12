"use client"

import { useState } from "react"
import Link from "next/link"
import PageHeader from "@/components/dashboard/PageHeader"
import { useDashboardData } from "@/components/dashboard/DashboardDataProvider"

const TAGS = {
  positive: { bg: "#EDF2D2", fg: "#4C5C2B" },
  neutral: { bg: "rgba(145,139,118,.16)", fg: "#6B6655" },
  negative: { bg: "#F5E3DE", fg: "#8E4130" },
} as const

function formatWhen(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(diffMs / 3_600_000)
  if (hours < 1) return "Just now"
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days} days ago`
  return new Date(iso).toLocaleDateString()
}

export default function CallsPage() {
  const { transcripts, loading } = useDashboardData()
  const [search, setSearch] = useState("")

  const filtered = transcripts.filter((c) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      c.company?.toLowerCase().includes(q) ||
      c.summary?.toLowerCase().includes(q) ||
      c.transcript.toLowerCase().includes(q)
    )
  })

  return (
    <div>
      <PageHeader
        title="Calls"
        subtitle="Every saved transcript, its recap, and the objections the copilot caught."
      />

      {loading ? (
        <p className="py-24 text-center text-sm text-[#918B76]">Loading…</p>
      ) : transcripts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[rgba(34,54,58,0.18)] bg-[#FAFAF7] px-6 py-[88px] text-center">
          <div className="font-display text-xl text-[#22363A]">No saved calls yet</div>
          <p className="m-0 max-w-[420px] text-[13px] leading-[1.6] text-[#918B76]">
            Transcripts save automatically when you stop listening in the extension while signed in.
          </p>
          <Link
            href="/extension"
            className="mt-2 rounded-[9px] bg-[#22363A] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#33505A]"
          >
            Get the extension
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[rgba(34,54,58,0.11)] bg-white">
          <div className="flex items-center gap-2.5 border-b border-[rgba(34,54,58,0.08)] px-[18px] py-3">
            <div className="flex max-w-[320px] flex-1 items-center gap-2 rounded-lg border border-[rgba(34,54,58,0.14)] px-2.5 py-[7px]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#918B76" strokeWidth="1.9" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search transcripts, quotes, companies"
                className="w-full bg-transparent text-[12.5px] text-[#22363A] placeholder:text-[#918B76] focus:outline-none"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="px-[18px] py-10 text-center text-[13px] text-[#918B76]">No calls match &ldquo;{search}&rdquo;.</p>
          ) : (
            filtered.map((c) => {
              const tag = TAGS[c.sentiment ?? "neutral"]
              return (
                <div
                  key={c.id}
                  className="grid grid-cols-[1fr_150px_120px_110px] items-center gap-[18px] border-b border-[rgba(34,54,58,0.06)] px-[18px] py-4 hover:bg-[#FAFAF7]"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[13.5px] font-medium text-[#22363A]">{c.company || "Unlabeled call"}</span>
                      {c.contact_name && <span className="text-[11.5px] text-[#918B76]">{c.contact_name}</span>}
                    </div>
                    <p className="mt-[5px] text-[12.5px] leading-[1.55] text-[#5C6A63]">
                      {c.summary || "Recap still generating…"}
                    </p>
                    {c.next_steps && (
                      <div className="mt-[7px] text-xs text-[#918B76]">
                        <span className="text-[#22363A]">Next:</span> {c.next_steps}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-[5px]">
                    {c.objection_categories.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-[rgba(34,54,58,0.16)] px-2 py-0.5 text-[11px] text-[#22363A] capitalize"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <span
                    style={{ background: tag.bg, color: tag.fg }}
                    className="w-fit rounded-full px-2.5 py-[3px] text-[11.5px] font-medium"
                  >
                    {c.sentiment ?? "pending"}
                  </span>
                  <div className="text-right text-xs text-[#918B76]">{formatWhen(c.created_at)}</div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
