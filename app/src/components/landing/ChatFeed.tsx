"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { PEOPLE, PersonAvatar, SalseyAvatar, type PersonKey } from "./feed-bits"

export type FeedItem =
  | { kind: "event"; node: React.ReactNode }
  | { kind: "message"; person: PersonKey; meta?: string; text: React.ReactNode }
  | { kind: "copilot"; label: React.ReactNode; text: React.ReactNode; took?: string }
  | { kind: "custom"; node: React.ReactNode }

const THINK_MS = 600
const STEP_MS = { event: 300, message: 500, copilot: 500, custom: 450 }

function Header({ name, meta }: { name: string; meta?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-2.5 text-[14px]">
      <span className="font-medium text-[#141F22]">{name}</span>
      {meta && <span className="flex items-center gap-1.5 text-[#141F22]/45">{meta}</span>}
    </div>
  )
}

const BUBBLE = "w-fit max-w-full rounded-[22px] bg-[#F2F2EE] px-5 py-3.5 text-[15px] leading-[1.55] text-[#141F22]/85"

function Row({ item, thinking }: { item: FeedItem; thinking: boolean }) {
  if (item.kind === "event") {
    return (
      <p className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 py-1 text-center text-[14px] text-[#141F22]/45">
        {item.node}
      </p>
    )
  }

  if (item.kind === "custom") return <div className="ps-12">{item.node}</div>

  if (item.kind === "copilot") {
    return (
      <div className="flex items-start gap-3">
        <SalseyAvatar />
        <div className="min-w-0 flex-1 pt-1.5">
          <Header name="Salsey" meta={item.label} />
          {/* Both states share one grid cell, so the bubble is sized for the answer up front
              and the swap from "thinking" to the answer is a crossfade, not a layout jump. */}
          <div className={`${BUBBLE} grid`}>
            <span
              className={`col-start-1 row-start-1 transition-[opacity,filter] duration-300 ease-entrance ${
                thinking ? "opacity-100" : "pointer-events-none opacity-0 blur-[4px]"
              }`}
            >
              <span className="text-shimmer text-[#141F22]/40 [--shimmer-highlight:#141F22]">Thinking…</span>
            </span>
            <span
              className={`col-start-1 row-start-1 transition-[opacity,filter] duration-400 ease-entrance ${
                thinking ? "opacity-0 blur-[4px]" : "opacity-100"
              }`}
            >
              {item.text}
              {item.took && <span className="mt-2 block text-[13px] text-[#141F22]/40">Answered in {item.took}</span>}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3">
      <PersonAvatar person={item.person} />
      <div className="min-w-0 flex-1 pt-1.5">
        <Header name={PEOPLE[item.person].name} meta={item.meta} />
        <div className={BUBBLE}>{item.text}</div>
      </div>
    </div>
  )
}

function schedule(items: FeedItem[]) {
  const steps: { at: number; visible: number; thinking: number | null }[] = []
  let t = 150
  items.forEach((item, i) => {
    if (item.kind === "copilot") {
      steps.push({ at: t, visible: i + 1, thinking: i })
      t += THINK_MS
      steps.push({ at: t, visible: i + 1, thinking: null })
    } else {
      steps.push({ at: t, visible: i + 1, thinking: null })
    }
    t += STEP_MS[item.kind]
  })
  return { steps, total: t }
}

export default function ChatFeed({ items }: { items: FeedItem[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const [visibleCount, setVisibleCount] = useState(0)
  const [thinkingIndex, setThinkingIndex] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const { steps, total } = useMemo(() => schedule(items), [items])

  const finish = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setVisibleCount(items.length)
    setThinkingIndex(null)
    setPlaying(false)
  }, [items.length])

  const play = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setVisibleCount(0)
    setThinkingIndex(null)
    setPlaying(true)
    for (const step of steps) {
      timers.current.push(
        setTimeout(() => {
          setVisibleCount(step.visible)
          setThinkingIndex(step.thinking)
        }, step.at),
      )
    }
    timers.current.push(setTimeout(finish, total))
  }, [steps, total, finish])

  // Start once the feed's top reaches the upper ~75% of the viewport.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect()
          play()
        } else if (entry.boundingClientRect.bottom < 0) {
          // Flung past it (or landed below via a link) — just show the finished conversation.
          observer.disconnect()
          finish()
        }
      },
      { rootMargin: "0px 0px -25% 0px" },
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      timers.current.forEach(clearTimeout)
    }
  }, [play, finish])

  const finished = !playing && visibleCount === items.length

  return (
    <div ref={ref} className="relative">
      <div className="flex flex-col gap-6">
        {items.map((item, i) => (
          <div
            key={i}
            className={`transition-[opacity,translate,filter] duration-450 ease-entrance ${
              i < visibleCount ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0 blur-[6px]"
            }`}
          >
            <Row item={item} thinking={thinkingIndex === i} />
          </div>
        ))}
      </div>

      <div className="relative mt-8 ms-12 h-5">
        <button
          onClick={play}
          className={`absolute inset-y-0 left-0 flex items-center gap-1.5 text-[13px] text-[#141F22]/45 transition-[opacity,color] duration-500 hover:text-[#141F22] ${
            finished ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          Replay
        </button>
      </div>
    </div>
  )
}
