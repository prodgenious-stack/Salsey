import { NextRequest, NextResponse } from "next/server"
import { createServiceSupabaseClient, getUserFromAuthHeader } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const user = await getUserFromAuthHeader(req.headers.get("authorization"))
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = createServiceSupabaseClient()
  const { data, error } = await supabase
    .from("sales_profiles")
    .select("offer, script, objections, accent_color")
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(
    data ?? { offer: "", script: "", objections: "", accent_color: "#3b82f6" },
  )
}

export async function PUT(req: NextRequest) {
  const user = await getUserFromAuthHeader(req.headers.get("authorization"))
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const supabase = createServiceSupabaseClient()
  const { error } = await supabase.from("sales_profiles").upsert({
    user_id: user.id,
    offer: body.offer ?? "",
    script: body.script ?? "",
    objections: body.objections ?? "",
    accent_color: body.accent_color ?? "#3b82f6",
    updated_at: new Date().toISOString(),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
