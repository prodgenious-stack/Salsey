"use client"

import { useState } from "react"
import Link from "next/link"
import RollingText from "./RollingText"

type Status = "idle" | "sending" | "done" | "error"

const STYLES = {
  dark: {
    shell: "border-white/15 bg-white/10 backdrop-blur-xl",
    input: "text-white placeholder:text-white/50",
    button: "bg-[#F2F79E] text-[#22363A]",
    done: "border-[#F2F79E]/30 bg-[#F2F79E]/10 text-white",
    note: "text-white/55",
    error: "text-[#F5B9A8]",
  },
  light: {
    shell: "border-[#141F22]/10 bg-[#F2F2EE]",
    input: "text-[#141F22] placeholder:text-[#141F22]/40",
    button: "bg-[#141F22] text-white hover:bg-[#2A3E43]",
    done: "border-[#141F22]/10 bg-[#F2F79E] text-[#141F22]",
    note: "text-[#141F22]/45",
    error: "text-[#B5543A]",
  },
}

export default function WaitlistForm({ tone, source }: { tone: "dark" | "light"; source: string }) {
  const [email, setEmail] = useState("")
  const [company, setCompany] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [error, setError] = useState("")
  const s = STYLES[tone]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === "sending") return
    setStatus("sending")
    setError("")
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source, company }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Something went wrong — please try again.")
      setStatus("done")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong — please try again.")
      setStatus("error")
    }
  }

  if (status === "done") {
    return (
      <div
        role="status"
        className={`anim-rise flex h-[58px] w-[405px] max-w-[calc(100vw-32px)] items-center justify-center gap-2.5 rounded-full border px-6 text-[14px] font-medium ${s.done}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5 10 17 19 7" />
        </svg>
        You&apos;re on the list — we&apos;ll email you when it&apos;s your turn.
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      <form
        onSubmit={handleSubmit}
        className={`flex h-[58px] w-[405px] max-w-[calc(100vw-32px)] items-center rounded-full border p-1.5 pl-5 ${s.shell}`}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Work email"
          aria-label="Work email"
          className={`min-w-0 flex-1 bg-transparent text-[14px] focus:outline-none ${s.input}`}
        />
        {/* Honeypot — hidden from people, filled in by bots. */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="absolute -left-[9999px] size-px opacity-0"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className={`group h-full shrink-0 rounded-full px-5 text-[13px] font-semibold transition-colors disabled:opacity-70 ${s.button}`}
        >
          <RollingText text={status === "sending" ? "Joining…" : "Join the waitlist"} />
        </button>
      </form>
      <p className={`mt-3 min-h-5 text-[13px] ${status === "error" ? s.error : s.note}`}>
        {status === "error" ? (
          error
        ) : (
          <>
            By joining, you agree to our{" "}
            <Link href="/terms" className="underline decoration-current/30 underline-offset-[3px] transition-colors hover:decoration-current">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline decoration-current/30 underline-offset-[3px] transition-colors hover:decoration-current">
              Privacy Policy
            </Link>
            .
          </>
        )}
      </p>
    </div>
  )
}
