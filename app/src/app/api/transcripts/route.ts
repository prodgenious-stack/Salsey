import { NextRequest, NextResponse } from "next/server"
import { createServiceSupabaseClient, getUserFromAuthHeader } from "@/lib/supabase/server"
import { generateCallRecap } from "@/lib/call-recap"

export async function GET(req: NextRequest) {
  const user = await getUserFromAuthHeader(req.headers.get("authorization"))
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = createServiceSupabaseClient()
  const { data, error } = await supabase
    .from("call_transcripts")
    .select(
      "id, transcript, summary, next_steps, sentiment, company, contact_name, created_at, call_objections(category)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const transcripts = data.map((row) => {
    const { call_objections, ...rest } = row
    const categories = Array.from(
      new Set((call_objections as { category: string }[] | null)?.map((o) => o.category) ?? []),
    )
    return { ...rest, objection_categories: categories }
  })

  return NextResponse.json({ transcripts })
}

export async function POST(req: NextRequest) {
  const user = await getUserFromAuthHeader(req.headers.get("authorization"))
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const transcript = typeof body.transcript === "string" ? body.transcript.trim() : ""
  if (!transcript) return NextResponse.json({ error: "transcript is required" }, { status: 400 })

  const supabase = createServiceSupabaseClient()
  const { data: inserted, error } = await supabase
    .from("call_transcripts")
    .insert({ user_id: user.id, transcript })
    .select("id, created_at")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Best-effort: the transcript is already saved regardless of whether the recap
  // succeeds. A short/unclear call or a transient model error shouldn't fail the save.
  try {
    const recap = await generateCallRecap(transcript)
    await supabase
      .from("call_transcripts")
      .update({
        summary: recap.summary,
        next_steps: recap.next_steps,
        sentiment: recap.sentiment,
        company: recap.company,
        contact_name: recap.contact_name,
        recap_generated_at: new Date().toISOString(),
      })
      .eq("id", inserted.id)

    if (recap.objections.length > 0) {
      await supabase.from("call_objections").insert(
        recap.objections.map((o) => ({
          call_id: inserted.id,
          user_id: user.id,
          category: o.category,
          quote: o.quote,
          handled_well: o.handled_well,
          note: o.note,
        })),
      )
    }
  } catch (recapError) {
    console.error("[call recap] failed", recapError)
  }

  return NextResponse.json({ ok: true, id: inserted.id, created_at: inserted.created_at })
}
