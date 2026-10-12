import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Pre-launch lockdown: only the landing page, legal pages and the waitlist endpoint are public.
// Everything else (login, dashboard, extension download, demo, and the AI/data APIs)
// redirects home or 404s. Set SALSEY_LAUNCHED=true in the environment to open it up.
const PUBLIC_PATHS = new Set(["/", "/privacy", "/terms", "/api/waitlist"])

export function proxy(request: NextRequest) {
  if (process.env.SALSEY_LAUNCHED === "true") return NextResponse.next()

  const { pathname } = request.nextUrl
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next()

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.redirect(new URL("/", request.url))
}

export const config = {
  // Skip Next internals and static files from /public (images, video, icons).
  matcher: ["/((?!_next/|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|mp4|webm|txt|xml|json)$).*)"],
}
