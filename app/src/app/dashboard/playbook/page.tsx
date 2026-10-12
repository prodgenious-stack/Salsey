"use client"

import { useEffect, useState } from "react"
import PageHeader from "@/components/dashboard/PageHeader"
import { useDashboardData } from "@/components/dashboard/DashboardDataProvider"

function BattlecardResponse({ category, session }: { category: string; session: { access_token: string } }) {
  const [response, setResponse] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch("/api/objections/rebuttal", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ category }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setResponse(data.rebuttal ?? "Couldn't generate a response for this one.")
      })
      .catch(() => {
        if (!cancelled) setResponse("Couldn't generate a response for this one.")
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category])

  if (!response) {
    return <p className="mt-2.5 text-[13px] text-[#918B76]">Generating…</p>
  }
  return <p className="mt-2.5 text-[13px] leading-[1.65] text-[#5C6A63]">{response}</p>
}

export default function PlaybookPage() {
  const { objectionSummary, loading, session } = useDashboardData()
  const topCategories = objectionSummary.slice(0, 4)

  return (
    <div>
      <PageHeader title="Playbook" subtitle="Battlecards generated from objections your team actually hears." />

      {loading ? (
        <p className="py-24 text-center text-sm text-[#918B76]">Loading…</p>
      ) : topCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[rgba(34,54,58,0.18)] bg-[#FAFAF7] px-6 py-[88px] text-center">
          <div className="font-display text-xl text-[#22363A]">No battlecards yet</div>
          <p className="m-0 max-w-[420px] text-[13px] leading-[1.6] text-[#918B76]">
            Battlecards generate automatically from objections flagged on your saved calls — save a few calls
            first and they'll show up here.
          </p>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-2 gap-4">
            {topCategories.map((o) => (
              <div key={o.category} className="flex flex-col overflow-hidden rounded-xl border border-[rgba(34,54,58,0.11)] bg-white">
                <div className="flex items-center justify-between border-b border-[rgba(34,54,58,0.08)] px-[18px] py-3.5">
                  <span className="rounded-full bg-[#F2F79E] px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.03em] text-[#3D4A2E] uppercase">
                    {o.category}
                  </span>
                  <span className="text-[11.5px] text-[#918B76]">
                    flagged {o.total}× · {o.handledWellRate}% handled well
                  </span>
                </div>
                <div className="px-[18px] py-4">
                  <div className="text-[13.5px] font-medium text-[#22363A]">
                    {o.examples[0] ? `“${o.examples[0].quote}”` : "No quote captured yet"}
                  </div>
                  {session && <BattlecardResponse category={o.category} session={session} />}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-[#918B76]">
            Generated fresh from your objection data each time you open this page.
          </p>
        </div>
      )}
    </div>
  )
}
