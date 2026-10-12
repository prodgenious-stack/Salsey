"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import PageHeader from "@/components/dashboard/PageHeader"
import { useDashboardData, type Insight } from "@/components/dashboard/DashboardDataProvider"
import { useUser } from "@/hooks/useUser"

const TAGS = {
  positive: { bg: "#EDF2D2", fg: "#4C5C2B" },
  neutral: { bg: "rgba(145,139,118,.16)", fg: "#6B6655" },
  negative: { bg: "#F5E3DE", fg: "#8E4130" },
} as const

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 60) return `${Math.max(mins, 1)}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days} days ago`
  return new Date(iso).toLocaleDateString()
}

function sparklineBuckets(transcripts: { created_at: string }[]) {
  const days: number[] = new Array(7).fill(0)
  const now = new Date()
  for (const t of transcripts) {
    const created = new Date(t.created_at)
    const dayDiff = Math.floor((now.getTime() - created.getTime()) / 86_400_000)
    if (dayDiff >= 0 && dayDiff < 7) days[6 - dayDiff] += 1
  }
  const max = Math.max(...days, 1)
  return days.map((count) => Math.max(Math.round((count / max) * 100), count > 0 ? 12 : 4))
}

export default function DashboardOverviewPage() {
  const { transcripts, objectionSummary, loading, session } = useDashboardData()
  const { user } = useUser()
  const [insights, setInsights] = useState<Insight[] | null>(null)
  const [insightsLoading, setInsightsLoading] = useState(false)

  useEffect(() => {
    if (!session || transcripts.length === 0) return
    setInsightsLoading(true)
    fetch("/api/insights", { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((res) => res.json())
      .then((data) => setInsights(data.insights ?? []))
      .catch(() => setInsights([]))
      .finally(() => setInsightsLoading(false))
  }, [session, transcripts.length])

  const firstName = user?.email ? user.email.split("@")[0].split(/[._-]/)[0] : ""
  const greeting =
    firstName.charAt(0).toUpperCase() + firstName.slice(1) || "there"

  if (loading) {
    return <div className="py-24 text-center text-sm text-[#918B76]">Loading…</div>
  }

  if (transcripts.length === 0) {
    return (
      <div>
        <PageHeader title={`Welcome, ${greeting}`} subtitle="No calls saved yet — here's where your data will show up." />
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[rgba(34,54,58,0.18)] bg-[#FAFAF7] px-6 py-[88px] text-center">
          <div className="font-display text-xl text-[#22363A]">No calls yet</div>
          <p className="m-0 max-w-[420px] text-[13px] leading-[1.6] text-[#918B76]">
            Install the extension, sign in, and stop listening at the end of a call to save it here. Metrics,
            objection patterns, and copilot insights will fill in automatically once you have a few.
          </p>
          <Link
            href="/extension"
            className="mt-2 rounded-[9px] bg-[#22363A] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#33505A]"
          >
            Get the extension
          </Link>
        </div>
      </div>
    )
  }

  const totalObjections = objectionSummary.reduce((sum, o) => sum + o.total, 0)
  const totalHandledWell = objectionSummary.reduce((sum, o) => sum + Math.round((o.handledWellRate / 100) * o.total), 0)
  const handledWellRate = totalObjections > 0 ? Math.round((totalHandledWell / totalObjections) * 100) : null

  const sparkHeights = sparklineBuckets(transcripts)
  const maxMixTotal = Math.max(...objectionSummary.map((o) => o.total), 1)
  const mixRamp = ["#22363A", "#3E5A61", "#5C7A80", "#918B76", "#B3AE9C", "#C9C5B7"]

  return (
    <div>
      <PageHeader
        title={`Good to see you, ${greeting}`}
        subtitle={`${transcripts.length} call${transcripts.length === 1 ? "" : "s"} analyzed — here's where deals are slipping.`}
      />

      <div className="mb-7 grid grid-cols-4 gap-3.5">
        <div className="rounded-[11px] border border-[rgba(34,54,58,0.11)] bg-white px-[18px] pt-4 pb-3.5">
          <div className="text-[11.5px] font-medium tracking-[0.03em] text-[#918B76] uppercase">Calls analyzed</div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-display text-[31px] leading-none text-[#22363A] tabular-nums">
              {transcripts.length}
            </span>
          </div>
          <div className="mt-3 flex h-[26px] items-end gap-[3px]">
            {sparkHeights.map((h, i) => (
              <span
                key={i}
                style={{ height: `${h}%`, background: i >= 5 ? "#22363A" : "rgba(145,139,118,.28)" }}
                className="flex-1 rounded-sm"
              />
            ))}
          </div>
        </div>

        <div className="rounded-[11px] border border-[rgba(34,54,58,0.11)] bg-white px-[18px] pt-4 pb-3.5">
          <div className="text-[11.5px] font-medium tracking-[0.03em] text-[#918B76] uppercase">
            Objections handled well
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-display text-[31px] leading-none text-[#22363A] tabular-nums">
              {handledWellRate !== null ? `${handledWellRate}%` : "—"}
            </span>
          </div>
          <div className="mt-[18px] h-1.5 overflow-hidden rounded-[3px] bg-[rgba(34,54,58,0.09)]">
            <span
              style={{ width: `${handledWellRate ?? 0}%` }}
              className="block h-full bg-[#22363A]"
            />
          </div>
        </div>

        <div className="rounded-[11px] border border-[rgba(34,54,58,0.11)] bg-white px-[18px] pt-4 pb-3.5">
          <div className="text-[11.5px] font-medium tracking-[0.03em] text-[#918B76] uppercase">Rep talk ratio</div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-display text-lg leading-none text-[#B3AE9C]">Not tracked yet</span>
          </div>
          <div className="mt-[18px] text-[11px] leading-[1.5] text-[#B3AE9C]">
            Needs audio-level analysis during the call — on the roadmap.
          </div>
        </div>

        <div className="rounded-[11px] border border-[rgba(34,54,58,0.11)] bg-[#22363A] px-[18px] pt-4 pb-3.5">
          <div className="text-[11.5px] font-medium tracking-[0.03em] text-[#F2F79E] uppercase">
            Won after objection
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-display text-lg leading-none text-white/60">Not tracked yet</span>
          </div>
          <div className="mt-4 text-[11.5px] leading-[1.5] text-white/50">
            Needs a deal-outcome field per call — on the roadmap.
          </div>
        </div>
      </div>

      <div className="mb-7 grid grid-cols-[1.35fr_1fr] gap-[18px]">
        <div className="overflow-hidden rounded-xl border border-[rgba(34,54,58,0.11)] bg-white">
          <div className="flex items-center justify-between border-b border-[rgba(34,54,58,0.08)] px-[18px] py-[15px]">
            <h2 className="font-display m-0 text-[17px] font-normal text-[#22363A]">Objection mix</h2>
            <Link href="/dashboard/objections" className="text-xs text-[#918B76] hover:text-[#5C7A80]">
              See all
            </Link>
          </div>
          {objectionSummary.length === 0 ? (
            <p className="px-[18px] py-6 text-[13px] text-[#918B76]">
              No objections flagged yet. They'll show up here once the copilot catches some on a call.
            </p>
          ) : (
            <div className="flex flex-col gap-3.5 p-[18px]">
              {objectionSummary.slice(0, 6).map((row, i) => (
                <div key={row.category} className="grid grid-cols-[78px_1fr_78px] items-center gap-3">
                  <span className="text-[12.5px] text-[#22363A] capitalize">{row.category}</span>
                  <span className="h-[9px] overflow-hidden rounded-[5px] bg-[rgba(34,54,58,0.07)]">
                    <span
                      style={{ width: `${(row.total / maxMixTotal) * 100}%`, background: mixRamp[i] ?? "#C9C5B7" }}
                      className="block h-full"
                    />
                  </span>
                  <span className="text-right text-xs text-[#918B76] tabular-nums">
                    {row.total} · {row.handledWellRate}% ok
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-[rgba(34,54,58,0.11)] bg-white">
          <div className="border-b border-[rgba(34,54,58,0.08)] px-[18px] py-[15px]">
            <h2 className="font-display m-0 text-[17px] font-normal text-[#22363A]">What the copilot flagged</h2>
          </div>
          <div className="flex flex-col">
            {insightsLoading ? (
              <p className="px-[18px] py-6 text-[13px] text-[#918B76]">Looking for patterns…</p>
            ) : !insights || insights.length === 0 ? (
              <p className="px-[18px] py-6 text-[13px] text-[#918B76]">
                Not enough calls yet for a real pattern — check back after a few more.
              </p>
            ) : (
              insights.map((item, i) => (
                <div
                  key={item.title}
                  className={`px-[18px] py-3.5 ${i < insights.length - 1 ? "border-b border-[rgba(34,54,58,0.07)]" : ""}`}
                >
                  <div className="text-[12.5px] font-medium text-[#22363A]">{item.title}</div>
                  <p className="mt-[5px] text-xs leading-[1.55] text-[#918B76]">{item.body}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[rgba(34,54,58,0.11)] bg-white">
        <div className="flex items-center justify-between border-b border-[rgba(34,54,58,0.08)] px-[18px] py-[15px]">
          <h2 className="font-display m-0 text-[17px] font-normal text-[#22363A]">Recent calls</h2>
          <Link href="/dashboard/calls" className="text-xs text-[#918B76] hover:text-[#5C7A80]">
            All {transcripts.length} calls
          </Link>
        </div>
        <div className="grid grid-cols-[2.2fr_110px_120px_92px] gap-4 border-b border-[rgba(34,54,58,0.07)] px-[18px] py-2.5 text-[11px] font-semibold tracking-[0.04em] text-[#918B76] uppercase">
          <span>Call</span>
          <span>Objections</span>
          <span>Sentiment</span>
          <span className="text-right">When</span>
        </div>
        {transcripts.slice(0, 4).map((row) => {
          const tag = TAGS[row.sentiment ?? "neutral"]
          return (
            <div
              key={row.id}
              className="grid grid-cols-[2.2fr_110px_120px_92px] items-center gap-4 border-b border-[rgba(34,54,58,0.06)] px-[18px] py-[13px] hover:bg-[#FAFAF7]"
            >
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-[#22363A]">{row.company || "Unlabeled call"}</div>
                <div className="mt-[3px] truncate text-xs text-[#918B76]">
                  {row.summary || "Recap still generating…"}
                </div>
              </div>
              <span className="text-[12.5px] text-[#22363A] tabular-nums">
                {row.objection_categories.length > 0 ? row.objection_categories.length : "—"}
              </span>
              <span
                style={{ background: tag.bg, color: tag.fg }}
                className="w-fit rounded-full px-2.5 py-[3px] text-[11.5px] font-medium"
              >
                {row.sentiment ?? "pending"}
              </span>
              <span className="text-right text-xs text-[#918B76]">{relativeTime(row.created_at)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
