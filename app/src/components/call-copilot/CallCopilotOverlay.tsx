"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronDown, Play, Sparkles, Wand2, MessageSquare, RotateCcw, Square, Loader2, Mic } from "lucide-react"
import LiquidGlass from "@/components/liquid-glass/LiquidGlass"
import { useLiveTranscript, isSpeechRecognitionSupported } from "@/hooks/useLiveTranscript"
import { NOOP } from "@/lib/copilot-shared"

interface CallCopilotOverlayProps {
  initialQuote?: string
}

const actions = [
  { key: "assist", label: "Assist", icon: Sparkles },
  { key: "what_should_i_say", label: "What should I say?", icon: Wand2 },
  { key: "follow_up_questions", label: "Follow-up questions", icon: MessageSquare },
  { key: "recap", label: "Recap", icon: RotateCcw },
]

// How long a gap in speech has to be before we treat it as "they paused, react now" —
// this fires mid-utterance on any micro-pause, not just once the speaker fully stops.
const SOFT_SILENCE_MS = 450
const MIN_TRIGGER_GAP_MS = 1200
const POLL_MS = 120
const STUCK_WARNING_MS = 5000

async function streamCopilot(
  action: string,
  question: string,
  recentSegment: string,
  transcript: string,
  onChunk: (chunk: string) => void,
) {
  const res = await fetch("/api/copilot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, question, transcript, recentSegment }),
  })
  if (!res.ok || !res.body) throw new Error(`Request failed (${res.status})`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    onChunk(decoder.decode(value, { stream: true }))
  }
}

export default function CallCopilotOverlay({
  initialQuote = "Press play to start listening — I'll jump in the moment it helps.",
}: CallCopilotOverlayProps) {
  const [question, setQuestion] = useState("")
  const [smart, setSmart] = useState(true)
  const [quote, setQuote] = useState(initialQuote)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [speechSupported, setSpeechSupported] = useState(true)

  useEffect(() => {
    setSpeechSupported(isSpeechRecognitionSupported())
  }, [])

  const lastReactedLenRef = useRef(0)
  const lastTriggerAtRef = useRef(0)
  const inFlightRef = useRef(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stuckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runAutoListen = useCallback(async (transcript: string, recentSegment: string) => {
    inFlightRef.current = true
    lastTriggerAtRef.current = Date.now()
    try {
      let buffer = ""
      let decided = false
      let isNoop = false

      await streamCopilot("auto_listen", "", recentSegment, transcript, (chunk) => {
        if (isNoop) return
        if (!decided) {
          buffer += chunk
          const trimmed = buffer.trim()
          if (trimmed.length >= NOOP.length || /\s/.test(buffer)) {
            decided = true
            if (trimmed === NOOP || trimmed.startsWith(NOOP)) {
              isNoop = true
            } else {
              setError(null)
              setQuote(buffer)
            }
          }
          return
        }
        setQuote((prev) => prev + chunk)
      })
    } catch (e) {
      console.error("auto_listen failed", e)
    } finally {
      inFlightRef.current = false
    }
  }, [])

  const { listening, interim, error: speechError, start, stop, reset, transcriptRef, interimRef, lastActivityRef, hasHeardRef } =
    useLiveTranscript(() => {})

  // Poll loop: reacts to any ~450ms pause in speech, mid-sentence or not — not gated on
  // the browser's own (often slow) end-of-utterance "isFinal" signal.
  useEffect(() => {
    if (!listening) {
      if (pollRef.current) clearInterval(pollRef.current)
      return
    }

    pollRef.current = setInterval(() => {
      if (inFlightRef.current) return
      const now = Date.now()
      const sinceActivity = now - lastActivityRef.current
      const sinceTrigger = now - lastTriggerAtRef.current
      if (sinceActivity < SOFT_SILENCE_MS || sinceTrigger < MIN_TRIGGER_GAP_MS) return

      const fullTranscript = transcriptRef.current
      const newFinal = fullTranscript.slice(lastReactedLenRef.current)
      const newPortion = `${newFinal} ${interimRef.current}`.trim()
      if (!newPortion) return

      lastReactedLenRef.current = fullTranscript.length
      const contextTranscript = `${fullTranscript} ${interimRef.current}`.trim()
      void runAutoListen(contextTranscript, newPortion)
    }, POLL_MS)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [listening, lastActivityRef, transcriptRef, interimRef, runAutoListen])

  function toggleListening() {
    if (listening) {
      stop()
      if (stuckTimeoutRef.current) clearTimeout(stuckTimeoutRef.current)
    } else {
      reset()
      lastReactedLenRef.current = 0
      lastTriggerAtRef.current = 0
      setQuote("Listening…")
      setError(null)
      start()

      stuckTimeoutRef.current = setTimeout(() => {
        if (!hasHeardRef.current) {
          setError(
            "Not hearing anything — check that mic access is allowed. If you're on Brave, it blocks Google's speech service by default; try Chrome, or allow it in your privacy settings.",
          )
        }
      }, STUCK_WARNING_MS)
    }
  }

  async function runManualAction(action: string, typedQuestion = "") {
    setLoading(true)
    setError(null)
    setQuote("")
    try {
      let first = true
      await streamCopilot(action, typedQuestion, "", transcriptRef.current, (chunk) => {
        if (first) {
          setLoading(false)
          first = false
        }
        setQuote((prev) => prev + chunk)
      })
    } catch (e) {
      setLoading(false)
      setError(e instanceof Error ? e.message : "Something went wrong")
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim() || loading) return
    void runManualAction("assist", question.trim())
    setQuestion("")
  }

  return (
    <div className="pointer-events-none flex w-full max-w-2xl flex-col items-center gap-3">
      {/* top toolbar pill */}
      <div className="pointer-events-auto relative h-[52px] w-[220px]">
        <LiquidGlass
          cornerRadius={999}
          padding="8px 10px"
          displacementScale={50}
          blurAmount={0.08}
          saturation={160}
          elasticity={0.1}
          style={{ position: "absolute", top: "50%", left: "50%" }}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={toggleListening}
              title={listening ? "Stop listening" : "Start listening"}
              className={`flex size-9 items-center justify-center rounded-full text-white transition-colors ${
                listening ? "bg-red-500/70 hover:bg-red-500/90" : "bg-white/15 hover:bg-white/25"
              }`}
            >
              {listening ? (
                <Mic className="size-4 animate-pulse" strokeWidth={2} />
              ) : (
                <Play className="size-4 fill-current" strokeWidth={0} />
              )}
            </button>
            <button className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/20">
              {listening ? "Live" : "Hide"}
              <ChevronDown className="size-3.5" />
            </button>
            <button
              onClick={listening ? toggleListening : undefined}
              className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <Square className="size-3.5 fill-current" strokeWidth={0} />
            </button>
          </div>
        </LiquidGlass>
      </div>

      {/* main answer + input panel */}
      <div className="pointer-events-auto w-full overflow-hidden rounded-3xl border border-white/10 bg-black/55 shadow-2xl backdrop-blur-2xl">
        <div className="flex flex-col gap-2 px-6 pt-6 pb-5">
          {loading ? (
            <div className="flex items-center gap-2 text-white/60">
              <Loader2 className="size-4 animate-spin" />
              <span className="text-sm">Thinking…</span>
            </div>
          ) : (
            <p className="text-lg leading-snug text-white/95">
              {error || speechError ? (
                <span className="text-red-300">{error || speechError}</span>
              ) : (
                <>&ldquo;{quote}&rdquo;</>
              )}
            </p>
          )}
          {listening && interim && !error && !speechError && (
            <p className="text-sm italic text-white/40">{interim}</p>
          )}
        </div>

        <div className="flex items-center gap-6 px-6 pb-4 text-sm text-white/70">
          {actions.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              disabled={loading}
              onClick={() => runManualAction(key)}
              className="flex items-center gap-1.5 transition-colors hover:text-white disabled:opacity-40"
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="border-t border-white/10 px-4 py-3">
          <form className="flex items-center gap-2" onSubmit={handleSubmit}>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about your screen or conversation, or"
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
            />
            <kbd className="hidden items-center gap-1 rounded-md border border-white/15 px-1.5 py-0.5 text-[11px] text-white/50 sm:flex">
              ⌘ ↵
            </kbd>
            <span className="text-[11px] text-white/40">for Assist</span>
          </form>

          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSmart((v) => !v)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                smart ? "bg-white/15 text-white" : "bg-white/5 text-white/50"
              }`}
            >
              <Sparkles className="size-3.5" />
              Smart
            </button>

            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || !question.trim()}
              className="flex size-8 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-500 disabled:opacity-40"
              aria-label="Send"
            >
              <Play className="size-3.5 fill-current" strokeWidth={0} />
            </button>
          </div>
        </div>
      </div>

      {!speechSupported && (
        <p className="pointer-events-auto rounded-lg bg-black/60 px-3 py-1.5 text-xs text-white/50">
          Live listening needs Chrome or Edge.
        </p>
      )}
    </div>
  )
}
