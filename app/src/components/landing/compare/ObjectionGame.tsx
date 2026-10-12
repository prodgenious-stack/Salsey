"use client"

import { useRef, useState } from "react"
import { PersonAvatar, SalseyAvatar } from "../feed-bits"
import { OBJECTION, OUTCOMES, PROSPECT, type Line } from "./data"

const LINE_GAP_MS = 750

/**
 * One objection, three ways to answer it. Opens on "Wing it" already played out; switching
 * paths replays that call, with a deal-momentum meter reacting to the outcome.
 */
export default function ObjectionGame() {
  const [choice, setChoice] = useState(0)
  const [shown, setShown] = useState(OUTCOMES[0].script.length + 1)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  function choose(i: number) {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setChoice(i)
    setShown(0)
    const lines = OUTCOMES[i].script.length
    for (let n = 1; n <= lines + 1; n++) {
      timers.current.push(setTimeout(() => setShown(n), 250 + (n - 1) * LINE_GAP_MS))
    }
  }

  const outcome = OUTCOMES[choice]
  const finished = shown > outcome.script.length
  const level = finished ? outcome.level : 0.55

  return (
    <div className="overflow-hidden rounded-[32px] bg-[#F2F2EE] p-2">
      <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_200px]">
        <div className="rounded-[26px] bg-white p-5 shadow-[0_1px_2px_rgba(20,31,34,0.05)] sm:p-8">
          {/* Prospect */}
          <div className="flex items-start gap-3">
            <PersonAvatar person="dana" size={40} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[13px]">
                <span className="font-medium text-[#141F22]">{PROSPECT.name}</span>
                <span className="text-[#141F22]/40">{PROSPECT.role}</span>
              </div>
              <p className="font-serif-display mt-2 text-[28px] leading-[1.12] tracking-[-0.01em] text-[#141F22] sm:text-[34px]">
                &ldquo;{OBJECTION}&rdquo;
              </p>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex flex-wrap items-center gap-2">
              {OUTCOMES.map((o, i) => (
                <button
                  key={o.key}
                  onClick={() => choose(i)}
                  className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                    i === choice ? "bg-[#141F22] text-white" : "bg-[#141F22]/[0.05] text-[#141F22]/60 hover:text-[#141F22]"
                  }`}
                >
                  {o.pick.title}
                </button>
              ))}
            </div>

            <div key={choice} className="mt-6 flex flex-col gap-3">
              {outcome.script.map((line, i) => (
                <ScriptLine key={i} line={line} visible={i < shown} />
              ))}
            </div>

            <div
              className={`mt-6 flex items-center justify-between rounded-2xl border px-4 py-3 transition-[opacity,translate] duration-700 ease-entrance ${
                finished ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
              } ${outcome.tone === "good" ? "border-[#141F22] bg-[#141F22] text-white" : "border-[#141F22]/10 text-[#141F22]"}`}
            >
              <span className={`text-[13px] ${outcome.tone === "good" ? "text-white/55" : "text-[#141F22]/45"}`}>Outcome</span>
              <span className="font-serif-display text-[24px] leading-none" style={outcome.tone === "bad" ? { color: "#B5543A" } : undefined}>
                {outcome.verdict}
              </span>
            </div>
          </div>
        </div>

        <MomentumMeter level={level} tone={finished ? outcome.tone : null} />
      </div>
    </div>
  )
}

function ScriptLine({ line, visible }: { line: Line; visible: boolean }) {
  const base = `transition-[opacity,translate,filter] duration-500 ease-entrance ${
    visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0 blur-[4px]"
  }`

  if (line.who === "salsey") {
    return (
      <div className={`${base} flex items-center gap-3 rounded-2xl bg-[#141F22] px-4 py-3 text-[14px] text-white`}>
        <SalseyAvatar size={26} />
        <span className="text-white/90">{line.text}</span>
      </div>
    )
  }
  if (line.who === "note") {
    return (
      <div className={`${base} flex items-center gap-2 px-1 text-[13px] text-[#141F22]/45`}>
        <span className="h-px w-6 bg-[#141F22]/20" />
        {line.text}
      </div>
    )
  }
  const you = line.who === "you"
  return (
    <div className={`${base} flex items-end gap-2.5 ${you ? "flex-row-reverse" : ""}`}>
      <PersonAvatar person={you ? "you" : "dana"} size={28} />
      <div
        className={`max-w-[80%] rounded-[20px] px-4 py-2.5 text-[15px] leading-[1.5] ${
          you ? "rounded-br-md bg-[#141F22] text-white" : "rounded-bl-md bg-[#F2F2EE] text-[#141F22]/85"
        }`}
      >
        {line.text}
      </div>
    </div>
  )
}

function MomentumMeter({ level, tone }: { level: number; tone: "bad" | "meh" | "good" | null }) {
  const color = tone === null ? "#141F22" : tone === "good" ? "#C9D24F" : tone === "bad" ? "#E07A5F" : "#9AA3A5"
  const label = tone === null ? "Live" : tone === "good" ? "Moving" : tone === "bad" ? "Stalled" : "Flat"
  return (
    <div className="flex items-center gap-5 rounded-[26px] bg-white px-6 py-5 lg:flex-col lg:items-stretch lg:py-8">
      <div className="text-[12px] font-medium tracking-[0.08em] text-[#141F22]/40 uppercase lg:text-center">Deal momentum</div>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-[#141F22]/[0.06] lg:mx-auto lg:h-auto lg:w-3 lg:flex-1">
        <div
          className="absolute bottom-0 left-0 h-full w-[var(--lvl)] rounded-full transition-[width,height,background-color] duration-[1200ms] ease-entrance lg:h-[var(--lvl)] lg:w-full"
          style={{ backgroundColor: color, ["--lvl" as string]: `${level * 100}%` }}
        />
      </div>
      <div className="text-right lg:text-center">
        <div className="font-serif-display text-[30px] leading-none text-[#141F22]">{label}</div>
      </div>
    </div>
  )
}
