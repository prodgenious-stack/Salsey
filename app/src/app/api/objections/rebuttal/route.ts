import { NextRequest, NextResponse } from "next/server"
import { createServiceSupabaseClient, getUserFromAuthHeader } from "@/lib/supabase/server"
import { generateRebuttal } from "@/lib/objection-rebuttal"

export async function POST(req: NextRequest) {
  const user = await getUserFromAuthHeader(req.headers.get("authorization"))
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const category = typeof body.category === "string" ? body.category : ""
  if (!category) return NextResponse.json({ error: "category is required" }, { status: 400 })

  const supabase = createServiceSupabaseClient()
  const { data, error } = await supabase
    .from("call_objections")
    .select("quote")
    .eq("user_id", user.id)
    .eq("category", category)
    .limit(10)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  try {
    const rebuttal = await generateRebuttal(
      category,
      data.map((r) => r.quote),
    )
    return NextResponse.json({ rebuttal })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Rebuttal generation failed" }, { status: 500 })
  }
}
