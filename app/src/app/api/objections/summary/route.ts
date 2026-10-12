import { NextRequest, NextResponse } from "next/server"
import { createServiceSupabaseClient, getUserFromAuthHeader } from "@/lib/supabase/server"

interface ObjectionRow {
  category: string
  quote: string
  handled_well: boolean
  call_transcripts: { company: string | null } | { company: string | null }[] | null
}

export async function GET(req: NextRequest) {
  const user = await getUserFromAuthHeader(req.headers.get("authorization"))
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = createServiceSupabaseClient()
  const { data, error } = await supabase
    .from("call_objections")
    .select("category, quote, handled_well, call_transcripts(company)")
    .eq("user_id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const byCategory = new Map<
    string,
    { total: number; handledWell: number; examples: { quote: string; company: string | null; handledWell: boolean }[] }
  >()

  for (const row of data as unknown as ObjectionRow[]) {
    const entry = byCategory.get(row.category) ?? { total: 0, handledWell: 0, examples: [] }
    entry.total += 1
    if (row.handled_well) entry.handledWell += 1
    if (entry.examples.length < 3) {
      const related = Array.isArray(row.call_transcripts) ? row.call_transcripts[0] : row.call_transcripts
      entry.examples.push({ quote: row.quote, company: related?.company ?? null, handledWell: row.handled_well })
    }
    byCategory.set(row.category, entry)
  }

  const summary = [...byCategory.entries()]
    .map(([category, stats]) => ({
      category,
      total: stats.total,
      handledWellRate: stats.total > 0 ? Math.round((stats.handledWell / stats.total) * 100) : 0,
      examples: stats.examples,
    }))
    .sort((a, b) => b.total - a.total)

  return NextResponse.json({ summary })
}
