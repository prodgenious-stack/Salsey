"use client"

import { useEffect, useState } from "react"
import PageHeader from "@/components/dashboard/PageHeader"
import { useDashboardData } from "@/components/dashboard/DashboardDataProvider"

export default function ObjectionsPage() {
  const { objectionSummary, loading, session } = useDashboardData()
  const [selected, setSelected] = useState<string | null>(null)
  const [rebuttal, setRebuttal] = useState<string | null>(null)
  const [rebuttalLoading, setRebuttalLoading] = useState(false)

  useEffect(() => {
    if (objectionSummary.length > 0 && !selected) setSelected(objectionSummary[0].category)
  }, [objectionSummary, selected])

  async function fetchRebuttal(category: string) {
    if (!session) return
    setRebuttalLoading(true)
    setRebuttal(null)
    try {
      const res = await fetch("/api/objections/rebuttal", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ category }),
      })
      const data = await res.json()
      setRebuttal(data.rebuttal ?? "Couldn't generate a rebuttal right now — try again.")
    } catch {
      setRebuttal("Couldn't generate a rebuttal right now — try again.")
    } finally {
      setRebuttalLoading(false)
    }
  }

  useEffect(() => {
    if (selected) void fetchRebuttal(selected)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  const detail = objectionSummary.find((o) => o.category === selected)
  const maxTotal = Math.max(...objectionSummary.map((o) => o.total), 1)

  return (
    <div>
      <PageHeader title="Objections" subtitle="Grouped by category across all saved calls, newest first." />

      {loading ? (
        <p className="py-24 text-center text-sm text-[#918B76]">Loading…</p>
      ) : objectionSummary.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[rgba(34,54,58,0.18)] bg-[#FAFAF7] px-6 py-[88px] text-center">
          <div className="font-display text-xl text-[#22363A]">No objections flagged yet</div>
          <p className="m-0 max-w-[420px] text-[13px] leading-[1.6] text-[#918B76]">
            Once you save calls where the copilot catches an objection, patterns will show up here — broken
            down by category with real quotes and a generated rebuttal.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[1fr_1.25fr] items-start gap-[18px]">
          <div className="flex flex-col gap-2.5">
            {objectionSummary.map((o) => {
              const on = selected === o.category
              return (
                <button
                  key={o.category}
                  onClick={() => setSelected(o.category)}
                  className={`w-full rounded-[11px] px-[17px] py-[15px] text-left ${
                    on ? "border border-[#22363A] bg-[#FAFAF7]" : "border border-[rgba(34,54,58,0.11)] bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2.5">
                    <span className="text-sm font-medium text-[#22363A] capitalize">{o.category}</span>
                    <span className="font-display text-xl text-[#22363A] tabular-nums">{o.total}</span>
                  </div>
                  <div className="mt-2.5 flex items-center gap-2.5">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-[3px] bg-[rgba(34,54,58,0.08)]">
                      <span style={{ width: `${(o.total / maxTotal) * 100}%` }} className="block h-full bg-[#22363A]" />
                    </span>
                    <span className="text-[11.5px] whitespace-nowrap text-[#918B76]">{o.handledWellRate}% handled well</span>
                  </div>
                </button>
              )
            })}
          </div>

          {detail && (
            <div className="overflow-hidden rounded-xl border border-[rgba(34,54,58,0.11)] bg-white">
              <div className="border-b border-[rgba(34,54,58,0.08)] bg-[#FAFAF7] px-5 py-[18px]">
                <div className="text-[11px] font-semibold tracking-[0.04em] text-[#918B76] uppercase">Category</div>
                <h2 className="font-display mt-[5px] text-[22px] font-normal text-[#22363A] capitalize">
                  {detail.category}
                </h2>
                <p className="mt-[7px] text-[13px] leading-[1.6] text-[#5C6A63]">
                  {detail.total} flagged, {detail.handledWellRate}% handled well across your saved calls.
                </p>
              </div>
              <div className="px-5 py-[18px]">
                <div className="text-[11px] font-semibold tracking-[0.04em] text-[#918B76] uppercase">
                  What prospects actually said
                </div>
                <div className="mt-3 flex flex-col gap-3">
                  {detail.examples.map((q) => (
                    <div key={q.quote} className="rounded-r-lg border-l-2 border-[#918B76] bg-[#FAFAF7] px-[15px] py-[13px]">
                      <p className="m-0 text-[13px] leading-[1.6] text-[#22363A]">&ldquo;{q.quote}&rdquo;</p>
                      <div className="mt-2 flex items-center gap-2 text-[11.5px] text-[#918B76]">
                        <span>{q.company || "Unlabeled call"}</span>
                        <span>·</span>
                        <span style={{ color: q.handledWell ? "#4C5C2B" : "#8E4130" }}>
                          {q.handledWell ? "handled well" : "not handled"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-[22px] rounded-[10px] bg-[#22363A] px-[18px] py-4">
                  <div className="flex items-center gap-[7px] text-[11px] font-semibold tracking-[0.04em] text-[#F2F79E] uppercase">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                      <path d="M9 18h6" />
                      <path d="M10 22h4" />
                    </svg>
                    Copilot rebuttal
                  </div>
                  <p className="mt-2.5 min-h-[3.3em] text-[13.5px] leading-[1.65] text-white">
                    {rebuttalLoading ? "Generating…" : rebuttal}
                  </p>
                  <div className="mt-3.5 flex gap-2">
                    <button className="rounded-[7px] border border-[#F2F79E] px-3 py-1.5 text-xs text-[#F2F79E] hover:bg-[rgba(242,247,158,0.12)]">
                      Add to playbook
                    </button>
                    <button
                      onClick={() => selected && fetchRebuttal(selected)}
                      disabled={rebuttalLoading}
                      className="rounded-[7px] border border-white/28 px-3 py-1.5 text-xs text-white/80 hover:border-white/55 disabled:opacity-50"
                    >
                      Regenerate
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
