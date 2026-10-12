import { NextRequest, NextResponse } from "next/server"
import { createServiceSupabaseClient, getUserFromAuthHeader } from "@/lib/supabase/server"
import { generateInsights } from "@/lib/dashboard-insights"

export async function GET(req: NextRequest) {
  const user = await getUserFromAuthHeader(req.headers.get("authorization"))
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = createServiceSupabaseClient()

  const [objectionsRes, transcriptsRes] = await Promise.all([
    supabase.from("call_objections").select("category, handled_well").eq("user_id", user.id),
    supabase
      .from("call_transcripts")
      .select("summary")
      .eq("user_id", user.id)
      .not("summary", "is", null)
      .order("created_at", { ascending: false })
      .limit(10),
  ])

  if (objectionsRes.error) return NextResponse.json({ error: objectionsRes.error.message }, { status: 500 })
  if (transcriptsRes.error) return NextResponse.json({ error: transcriptsRes.error.message }, { status: 500 })

  const recentCallSummaries = transcriptsRes.data.map((r) => r.summary).filter((s): s is string => Boolean(s))

  // Not enough signal to say anything real yet — return no insights rather than a
  // model call that would just have to hedge.
  if (objectionsRes.data.length === 0 && recentCallSummaries.length === 0) {
    return NextResponse.json({ insights: [] })
  }

  const byCategory = new Map<string, { total: number; handledWell: number }>()
  for (const row of objectionsRes.data) {
    const entry = byCategory.get(row.category) ?? { total: 0, handledWell: 0 }
    entry.total += 1
    if (row.handled_well) entry.handledWell += 1
    byCategory.set(row.category, entry)
  }
  const objectionSummary = [...byCategory.entries()].map(([category, stats]) => ({
    category,
    total: stats.total,
    handledWellRate: stats.total > 0 ? Math.round((stats.handledWell / stats.total) * 100) : 0,
  }))

  try {
    const insights = await generateInsights(objectionSummary, recentCallSummaries)
    return NextResponse.json({ insights })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Insights generation failed" }, { status: 500 })
  }
}
