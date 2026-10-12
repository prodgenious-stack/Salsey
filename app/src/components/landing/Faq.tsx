"use client"

import { useState } from "react"
import Link from "next/link"
import Reveal from "./Reveal"

const GROUPS = [
  {
    title: "Salsey",
    items: [
      {
        q: "What does Salsey actually do on a call?",
        a: "It listens to the conversation in your browser, spots objections the moment the prospect raises them, and shows you a short, casual answer to say next — grounded in your offer and playbook, not generic sales advice.",
      },
      {
        q: "Do I need to install anything?",
        a: "Just the Chrome extension. Sign in, open a Google Meet call, and the overlay appears. Everything else — your calls, objections and recaps — lives in the web dashboard.",
      },
      {
        q: "How does it know what to say about my product?",
        a: "You add your offer, pricing and common objections once in the playbook. Salsey uses that context for every suggestion, so answers sound like you and stay accurate.",
      },
      {
        q: "What happens after the call?",
        a: "You get a recap with the objections that came up, how each was handled, and next steps. Over time the dashboard shows which objections cost you deals and which rebuttals work.",
      },
    ],
  },
  {
    title: "Calls & privacy",
    items: [
      {
        q: "Which call platforms are supported?",
        a: "Google Meet in Chrome today. Zoom support is next on the roadmap.",
      },
      {
        q: "Can the prospect see Salsey?",
        a: "The overlay only appears in your browser tab. Nobody else on the call sees it unless you share that tab or your whole screen.",
      },
      {
        q: "Who can see my call transcripts?",
        a: "Only you. Transcripts are tied to your account and protected by row-level security, so no other user can read them.",
      },
    ],
  },
]

function Item({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-[#141F22]/10">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-6 py-5 text-left text-[16px] text-[#141F22]/85 transition-colors hover:text-[#141F22] sm:text-[17px]"
      >
        {q}
        <span className="relative size-4 shrink-0 text-[#141F22]/45">
          <span className="absolute top-1/2 left-0 h-px w-4 -translate-y-1/2 bg-current" />
          <span
            className={`absolute top-0 left-1/2 h-4 w-px -translate-x-1/2 bg-current transition-transform duration-500 ease-entrance ${
              open ? "scale-y-0" : "scale-y-100"
            }`}
          />
        </span>
      </button>
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-500 ease-entrance ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="max-w-[640px] pb-6 text-[15px] leading-[1.65] text-[#141F22]/60">{a}</p>
        </div>
      </div>
    </div>
  )
}

export default function Faq() {
  const [open, setOpen] = useState<string | null>("0-0")

  return (
    <section id="faq" className="scroll-mt-16 px-5 py-24 sm:px-9 md:py-36">
      <div className="mx-auto w-full max-w-[808px]">
        <Reveal>
          <h2 className="font-serif-display text-center text-[44px] leading-[0.98] tracking-[-0.02em] text-[#141F22] sm:text-[58px] lg:text-[72px]">
            Questions &amp; Answers
          </h2>
        </Reveal>

        <div className="mt-14 flex flex-col gap-12">
          {GROUPS.map((group, g) => (
            <Reveal key={group.title} delay={g * 80}>
              <h3 className="mb-3 text-[13px] text-[#141F22]/45">{group.title}</h3>
              <div className="border-t border-[#141F22]/10">
                {group.items.map((item, i) => {
                  const key = `${g}-${i}`
                  return (
                    <Item
                      key={key}
                      q={item.q}
                      a={item.a}
                      open={open === key}
                      onToggle={() => setOpen(open === key ? null : key)}
                    />
                  )
                })}
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-14 text-center">
          <p className="text-[15px] text-[#141F22]/45">
            Still deciding?{" "}
            <Link href="#waitlist" className="font-medium text-[#141F22] underline decoration-[#141F22]/25 underline-offset-4 transition-colors hover:decoration-[#141F22]">
              Join the waitlist →
            </Link>
          </p>
        </Reveal>
      </div>
    </section>
  )
}
