import { NextResponse } from "next/server"
import { createServiceSupabaseClient } from "@/lib/supabase/server"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function POST(request: Request) {
  let body: { email?: unknown; source?: unknown; company?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  // Honeypot: the form's hidden "company" field is only ever filled in by bots.
  if (typeof body.company === "string" && body.company.trim()) {
    return NextResponse.json({ ok: true })
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 })
  }
  const source = typeof body.source === "string" ? body.source.slice(0, 40) : null

  try {
    const supabase = createServiceSupabaseClient()
    // Signing up twice is fine — keep the first row and report success either way.
    const { error } = await supabase.from("waitlist").upsert({ email, source }, { onConflict: "email", ignoreDuplicates: true })
    if (error) throw error
  } catch (e) {
    console.error("waitlist insert failed", e)
    return NextResponse.json({ error: "Couldn't save that right now — please try again in a minute." }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
