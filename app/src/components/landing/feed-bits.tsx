"use client"

import { useState } from "react"
import Image from "next/image"

// Fictional demo people for the landing page feeds (AI-generated portraits, not real people).
export const PEOPLE = {
  dana: { name: "Dana", meta: "Head of Ops · Northwind", photo: "/landing/people/dana.jpg" },
  marcus: { name: "Marcus", meta: "VP Sales · Acme Logistics", photo: "/landing/people/marcus.jpg" },
  priya: { name: "Priya", meta: "Finance · Northwind", photo: "/landing/people/priya.jpg" },
  you: { name: "You", meta: undefined, photo: "/landing/people/you.jpg" },
} as const

export type PersonKey = keyof typeof PEOPLE

export function PersonAvatar({ person, size = 36 }: { person: PersonKey; size?: number }) {
  const p = PEOPLE[person]
  return (
    <Image
      src={p.photo}
      alt={p.name}
      width={size * 2}
      height={size * 2}
      style={{ width: size, height: size }}
      className="shrink-0 rounded-full object-cover shadow-[0_0_0_1px_rgba(20,31,34,0.06)]"
    />
  )
}

export function SalseyAvatar({ size = 36 }: { size?: number }) {
  return (
    <span
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-full bg-[linear-gradient(140deg,#F7FBC4_0%,#DCE46A_100%)] shadow-[0_0_0_1px_rgba(20,31,34,0.06)]"
    >
      <Image src="/salsey-icon.png" alt="" width={size * 0.45} height={size * 0.45} />
    </span>
  )
}

/** Inline "avatar + name" used inside event lines, like a mention. */
export function InlinePerson({ person }: { person: PersonKey | "salsey" }) {
  return (
    <span className="inline-flex items-center gap-1.5 align-middle font-medium text-[#141F22]">
      {person === "salsey" ? <SalseyAvatar size={18} /> : <PersonAvatar person={person} size={18} />}
      {person === "salsey" ? "Salsey" : PEOPLE[person].name}
    </span>
  )
}

export function MeetIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="shrink-0">
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H11v7H3V7.5Z" fill="#4285F4" />
      <path d="M3 12h8v7H5.5A2.5 2.5 0 0 1 3 16.5V12Z" fill="#34A853" />
      <path d="M11 5h3.5A2.5 2.5 0 0 1 17 7.5V12h-6V5Z" fill="#FBBC04" />
      <path d="M11 12h6v4.5a2.5 2.5 0 0 1-2.5 2.5H11v-7Z" fill="#0F9D58" />
      <path d="m17 10 4-3v10l-4-3v-4Z" fill="#00832D" />
    </svg>
  )
}

export function FileChip({ name, kind = "pdf" }: { name: string; kind?: "pdf" | "doc" }) {
  return (
    <span className="mx-0.5 inline-flex items-center gap-1.5 rounded-lg bg-white px-2 py-0.5 align-middle text-[14px] font-medium text-[#141F22] shadow-[0_0_0_1px_rgba(20,31,34,0.08)]">
      <svg width="14" height="16" viewBox="0 0 14 16" aria-hidden>
        <path d="M2 0h7l5 5v9a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2Z" fill={kind === "pdf" ? "#E5534B" : "#4285F4"} />
        <path d="M9 0v3a2 2 0 0 0 2 2h3" fill="#fff" fillOpacity=".45" />
      </svg>
      {name}
    </span>
  )
}

export function Tag({ children, tone = "lime" }: { children: React.ReactNode; tone?: "lime" | "muted" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 align-middle text-[12px] font-medium ${
        tone === "lime" ? "bg-[#F2F79E] text-[#141F22]" : "bg-[#141F22]/[0.06] text-[#141F22]/60"
      }`}
    >
      {children}
    </span>
  )
}

/** The suggested-line card Salsey shows mid-call — "Use this line" is clickable. */
export function SuggestionCard() {
  const [used, setUsed] = useState(false)
  return (
    <div className="rounded-[24px] bg-[#F2F2EE] p-5">
      <div className="flex flex-wrap items-center gap-2 text-[15px] font-medium text-[#141F22]">
        Objection from <InlinePerson person="dana" />
        <Tag>Existing tool</Tag>
      </div>
      <p className="mt-3 text-[14px] leading-[1.6] text-[#141F22]/55">
        “We already use a notetaker. Not sure we need another tool.”
      </p>
      <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-white p-3 pl-4 shadow-[0_0_0_1px_rgba(20,31,34,0.06)] sm:flex-row sm:items-center">
        <span className="flex-1 text-[14px] leading-[1.5] text-[#141F22]">
          “Totally — notes tell you what happened. We help in the moment, while the deal&apos;s still live.”
        </span>
        <button
          onClick={() => setUsed(true)}
          className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition-colors duration-300 ${
            used ? "bg-[#F2F79E] text-[#141F22]" : "bg-[#141F22] text-white hover:bg-[#2A3E43]"
          }`}
        >
          {used ? "✓ Used" : "Use this line"}
        </button>
      </div>
    </div>
  )
}

/** Playbook excerpt Salsey grounded its answer in. */
export function PlaybookCard() {
  const rows = [
    { label: "Team plan", value: "Per seat, billed monthly" },
    { label: "Annual", value: "2 months free" },
    { label: "Discovery tip", value: "Ask how many reps are on calls daily" },
  ]
  return (
    <div className="rounded-[24px] bg-[#F2F2EE] p-2">
      <div className="flex items-center gap-2.5 px-3 pt-2.5 pb-3 text-[15px] font-medium text-[#141F22]">
        <FileChip name="Pricing playbook.pdf" />
        <span className="text-[13px] font-normal text-[#141F22]/40">page 2</span>
      </div>
      <div className="rounded-[18px] bg-white px-4 py-1 shadow-[0_0_0_1px_rgba(20,31,34,0.06)]">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`flex items-center justify-between gap-4 py-3 text-[14px] ${i ? "border-t border-[#141F22]/[0.07]" : ""}`}
          >
            <span className="text-[#141F22]/50">{row.label}</span>
            <span className="text-right text-[#141F22]">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Post-call recap card with objection outcomes and a jump into the dashboard. */
export function RecapCard() {
  const rows = [
    { label: "Already uses a notetaker", handled: true },
    { label: "Budget timing", handled: false },
  ]
  return (
    <div className="rounded-[24px] bg-[#F2F2EE] p-2">
      <div className="flex items-center gap-2.5 px-3 pt-2.5 pb-3 text-[15px]">
        <MeetIcon />
        <span className="font-medium text-[#141F22]">Discovery call · Northwind</span>
        <span className="text-[#141F22]/40">32 min</span>
        <span className="ms-auto flex -space-x-1.5">
          <PersonAvatar person="dana" size={22} />
          <PersonAvatar person="priya" size={22} />
          <PersonAvatar person="you" size={22} />
        </span>
      </div>
      <div className="rounded-[18px] bg-white p-4 shadow-[0_0_0_1px_rgba(20,31,34,0.06)]">
        <p className="text-[14px] leading-[1.6] text-[#141F22]/70">
          Dana is open to a pilot; Priya needs budget sign-off first. Strong interest in live coaching over notes.
        </p>
        <div className="mt-3">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between border-t border-[#141F22]/[0.07] py-2.5 text-[14px]">
              <span className="text-[#141F22]/85">{row.label}</span>
              {row.handled ? <Tag>Handled</Tag> : <Tag tone="muted">Follow up</Tag>}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3 px-3 pt-3 pb-1.5">
        <span className="flex-1 text-[13px] text-[#141F22]/50">Next step: send pilot proposal by Friday</span>
        <span className="rounded-full bg-[#141F22] px-3.5 py-1.5 text-[12px] font-medium text-white">Open in dashboard ↗</span>
      </div>
    </div>
  )
}
