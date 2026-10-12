import { useCallback, useEffect, useRef, useState } from "react"
import LiquidGlass from "./liquid-glass/LiquidGlass"
import { useLiveTranscript, isSpeechRecognitionSupported } from "./useLiveTranscript"
import { streamCopilot } from "./streamCopilot"
import { getMicBaseline, getSettings, setMicBaseline, setOverlayPosition } from "../shared/storage"
import { getAverageLevel, sampleMicVolumeOnce, useMicVolumeMonitor } from "./mic-volume"
import { DEFAULT_SETTINGS, NOOP } from "../shared/types"

interface CallCopilotOverlayProps {
  onClose: () => void
  hostId: string
}

type Speaker = "rep" | "prospect"

interface Entry {
  id: number
  text: string
  trigger?: string
  triggerSpeaker?: Speaker
}

// A transcript chunk's average mic loudness needs to clear this fraction of the rep's
// calibrated baseline to be tagged "rep" — below it, it's assumed to be the prospect's
// voice bleeding through the speakers instead of the rep speaking directly into the mic.
const REP_LOUDNESS_RATIO = 0.55

const actions = [
  { key: "assist", label: "Assist" },
  { key: "what_should_i_say", label: "What should I say?" },
  { key: "follow_up_questions", label: "Follow-up questions" },
  { key: "recap", label: "Recap" },
]

const SOFT_SILENCE_MS = 450
const MIN_TRIGGER_GAP_MS = 1200
const POLL_MS = 120
const STUCK_WARNING_MS = 5000
const MAX_CONCURRENT_AUTO = 2
const MAX_ENTRIES = 4

export default function CallCopilotOverlay({ onClose, hostId }: CallCopilotOverlayProps) {
  const [question, setQuestion] = useState("")
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [speechSupported, setSpeechSupported] = useState(true)
  const [accentColor, setAccentColor] = useState(DEFAULT_SETTINGS.accentColor)
  const [micBaseline, setMicBaselineState] = useState<number | null>(null)
  const [calibrating, setCalibrating] = useState(false)
  const [calibrateMessage, setCalibrateMessage] = useState<string | null>(null)

  useEffect(() => {
    setSpeechSupported(isSpeechRecognitionSupported())
    getSettings().then((s) => setAccentColor(s.accentColor))
    getMicBaseline().then(setMicBaselineState)
    function onStorageChange(changes: { [key: string]: chrome.storage.StorageChange }, area: string) {
      if (area === "local" && changes.copilotSettings?.newValue) {
        setAccentColor(changes.copilotSettings.newValue.accentColor ?? DEFAULT_SETTINGS.accentColor)
      }
    }
    chrome.storage.onChanged.addListener(onStorageChange)
    return () => chrome.storage.onChanged.removeListener(onStorageChange)
  }, [])

  const nextEntryIdRef = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const labeledTranscriptRef = useRef("")

  async function handleCalibrate() {
    setCalibrating(true)
    setCalibrateMessage("Say a sentence out loud… (2.5s)")
    try {
      const level = await sampleMicVolumeOnce(2500)
      await setMicBaseline(level)
      setMicBaselineState(level)
      setCalibrateMessage("Calibrated — the copilot can now guess who's talking.")
    } catch {
      setCalibrateMessage("Couldn't access the mic to calibrate — check mic permissions.")
    } finally {
      setCalibrating(false)
      setTimeout(() => setCalibrateMessage(null), 3000)
    }
  }

  function pushEntry(initialText: string, trigger?: string, triggerSpeaker?: Speaker) {
    const id = nextEntryIdRef.current++
    setEntries((prev) => [...prev, { id, text: initialText, trigger, triggerSpeaker }].slice(-MAX_ENTRIES))
    return id
  }

  function appendToEntry(id: number, chunk: string) {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, text: e.text + chunk } : e)))
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [entries])

  const lastReactedLenRef = useRef(0)
  const lastTriggerAtRef = useRef(0)
  const inFlightCountRef = useRef(0)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stuckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runAutoListen = useCallback(async (transcript: string, recentSegment: string, triggerSpeaker?: Speaker) => {
    inFlightCountRef.current += 1
    lastTriggerAtRef.current = Date.now()
    try {
      let buffer = ""
      let decided = false
      let isNoop = false
      let entryId: number | null = null

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
              entryId = pushEntry(buffer, recentSegment.trim(), triggerSpeaker)
            }
          }
          return
        }
        if (entryId !== null) appendToEntry(entryId, chunk)
      })
    } catch (e) {
      console.error("auto_listen failed", e)
    } finally {
      inFlightCountRef.current -= 1
    }
  }, [])

  const {
    listening,
    interim,
    error: speechError,
    start,
    stop,
    reset,
    transcriptRef,
    interimRef,
    lastActivityRef,
    hasHeardRef,
    audioStartedRef,
  } = useLiveTranscript(() => {})

  // Opening a second getUserMedia call at the exact same instant SpeechRecognition is
  // negotiating its own mic access caused real, confirmed-reproducible failures (two
  // requests racing for the mic — speech recognition would come up with nothing).
  // Waiting for the real onaudiostart signal (audioStartedRef) instead of a guessed
  // delay avoids the race regardless of how long that negotiation actually takes.
  const [volumeMonitorActive, setVolumeMonitorActive] = useState(false)
  useEffect(() => {
    if (!listening) {
      setVolumeMonitorActive(false)
      return
    }
    const poll = setInterval(() => {
      if (audioStartedRef.current) {
        setVolumeMonitorActive(true)
        clearInterval(poll)
      }
    }, 100)
    // Fallback in case onaudiostart never fires (older browser quirk) — still better
    // than never starting the volume monitor at all.
    const fallback = setTimeout(() => setVolumeMonitorActive(true), 4000)
    return () => {
      clearInterval(poll)
      clearTimeout(fallback)
    }
  }, [listening, audioStartedRef])
  const volumeLogRef = useMicVolumeMonitor(volumeMonitorActive)

  useEffect(() => {
    if (!listening) {
      if (pollRef.current) clearInterval(pollRef.current)
      return
    }

    pollRef.current = setInterval(() => {
      if (inFlightCountRef.current >= MAX_CONCURRENT_AUTO) return
      const now = Date.now()
      const sinceActivity = now - lastActivityRef.current
      const sinceTrigger = now - lastTriggerAtRef.current
      if (sinceActivity < SOFT_SILENCE_MS || sinceTrigger < MIN_TRIGGER_GAP_MS) return

      const fullTranscript = transcriptRef.current
      const newFinal = fullTranscript.slice(lastReactedLenRef.current)
      const newPortion = `${newFinal} ${interimRef.current}`.trim()
      if (!newPortion) return

      // Window of audio this chunk was likely spoken in — from the last time we reacted
      // (or a short fallback if this is the very first chunk) up to right now.
      const windowStart = lastTriggerAtRef.current || now - 3000
      lastReactedLenRef.current = fullTranscript.length

      let speaker: Speaker | undefined
      if (micBaseline !== null) {
        const avgLevel = getAverageLevel(volumeLogRef.current, windowStart, now)
        if (avgLevel !== null) {
          speaker = avgLevel >= micBaseline * REP_LOUDNESS_RATIO ? "rep" : "prospect"
        }
      }

      const label = speaker === "rep" ? "REP" : speaker === "prospect" ? "PROSPECT" : null
      const labeledPortion = label ? `${label}: ${newPortion}` : newPortion
      labeledTranscriptRef.current = `${labeledTranscriptRef.current}\n${labeledPortion}`.trim()

      void runAutoListen(labeledTranscriptRef.current, labeledPortion, speaker)
    }, POLL_MS)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [listening, lastActivityRef, transcriptRef, interimRef, runAutoListen, micBaseline, volumeLogRef])

  function toggleListening() {
    if (listening) {
      stop()
      if (stuckTimeoutRef.current) clearTimeout(stuckTimeoutRef.current)
      // Prefer the speaker-labeled transcript when available — same raw content, plus
      // REP:/PROSPECT: tags that make the saved recap's objection extraction sharper.
      const transcript = (labeledTranscriptRef.current || transcriptRef.current).trim()
      if (transcript) {
        chrome.runtime.sendMessage({ type: "save-transcript", transcript }).catch(() => {
          // background may be asleep momentarily — not worth surfacing to the rep mid-call
        })
      }
    } else {
      reset()
      lastReactedLenRef.current = 0
      lastTriggerAtRef.current = 0
      labeledTranscriptRef.current = ""
      setEntries([])
      setError(null)
      start()

      stuckTimeoutRef.current = setTimeout(async () => {
        if (hasHeardRef.current) return

        // Give an actual diagnosis instead of guessing — check the real permission state
        // rather than assuming a browser-specific quirk that may not apply here.
        let permissionState: PermissionState | "unknown" = "unknown"
        try {
          const status = await navigator.permissions.query({ name: "microphone" as PermissionName })
          permissionState = status.state
        } catch {
          // Permissions API for "microphone" isn't supported everywhere — fall back to the generic message below
        }

        if (permissionState === "denied") {
          setError(
            "Mic access is blocked for this site. Click the lock/site-info icon in the address bar, allow microphone access, then click Play again.",
          )
        } else if (permissionState === "granted") {
          setError(
            "Mic access is allowed, but nothing's coming through — check the right input device is selected (chrome://settings/content/microphone), that you're not on mute, and try Stop then Play again.",
          )
        } else {
          setError(
            "Not hearing anything — check that mic access is allowed for this site. If you're on Brave, it blocks Google's speech service by default; try Chrome, or allow it in your privacy settings.",
          )
        }
      }, STUCK_WARNING_MS)
    }
  }

  async function runManualAction(action: string, typedQuestion = "") {
    setLoading(true)
    setError(null)
    try {
      let entryId: number | null = null
      const transcriptForPrompt = labeledTranscriptRef.current || transcriptRef.current
      await streamCopilot(action, typedQuestion, "", transcriptForPrompt, (chunk) => {
        if (entryId === null) {
          setLoading(false)
          entryId = pushEntry(chunk)
        } else {
          appendToEntry(entryId, chunk)
        }
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

  const dragStateRef = useRef<{ startX: number; startY: number; hostLeft: number; hostTop: number } | null>(null)

  function handleDragPointerDown(e: React.PointerEvent) {
    const hostEl = document.getElementById(hostId)
    if (!hostEl) return
    const rect = hostEl.getBoundingClientRect()
    dragStateRef.current = { startX: e.clientX, startY: e.clientY, hostLeft: rect.left, hostTop: rect.top }
    hostEl.style.left = `${rect.left}px`
    hostEl.style.top = `${rect.top}px`
    hostEl.style.transform = "none"
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  function handleDragPointerMove(e: React.PointerEvent) {
    const drag = dragStateRef.current
    const hostEl = document.getElementById(hostId)
    if (!drag || !hostEl) return
    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY
    hostEl.style.left = `${drag.hostLeft + dx}px`
    hostEl.style.top = `${drag.hostTop + dy}px`
  }

  function handleDragPointerUp() {
    const hostEl = document.getElementById(hostId)
    dragStateRef.current = null
    if (!hostEl) return
    const rect = hostEl.getBoundingClientRect()
    void setOverlayPosition({ top: rect.top, left: rect.left })
  }

  return (
    <div className="pointer-events-none flex w-full max-w-2xl flex-col items-center gap-3 font-sans">
      <div className="pointer-events-auto relative h-[52px] w-[260px]">
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
              {listening ? <MicIcon pulsing /> : <PlayIcon />}
            </button>
            <span
              onPointerDown={handleDragPointerDown}
              onPointerMove={handleDragPointerMove}
              onPointerUp={handleDragPointerUp}
              title="Drag to move"
              className="cursor-grab select-none rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white active:cursor-grabbing"
            >
              {listening ? "Live" : "Idle"}
            </span>
            <button
              onClick={onClose}
              title="Close copilot"
              className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <CloseIcon />
            </button>
          </div>
        </LiquidGlass>
      </div>

      <div
        className="pointer-events-auto w-full overflow-hidden rounded-3xl border bg-black/55 shadow-2xl backdrop-blur-2xl"
        style={{ borderColor: `${accentColor}66`, boxShadow: `0 0 0 1px ${accentColor}33, 0 20px 60px rgba(0,0,0,0.5)` }}
      >
        <div ref={scrollRef} className="flex max-h-64 flex-col gap-3 overflow-y-auto px-6 pt-6 pb-5">
          {error || speechError ? (
            <p className="text-lg leading-snug text-red-300">{error || speechError}</p>
          ) : entries.length === 0 ? (
            <p className="text-lg leading-snug text-white/50">
              {loading ? "" : "Press play to start listening — I'll jump in the moment it helps."}
            </p>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="flex flex-col gap-1">
                {entry.trigger && (
                  <p className="text-xs text-white/40">
                    Responding to {entry.triggerSpeaker === "rep" ? "(you)" : entry.triggerSpeaker === "prospect" ? "(them)" : ""}:{" "}
                    &ldquo;{entry.trigger.replace(/^(REP|PROSPECT):\s*/, "")}&rdquo;
                  </p>
                )}
                <p className="text-lg leading-snug text-white/95">
                  &ldquo;{entry.text}&rdquo;
                </p>
              </div>
            ))
          )}
          {loading && (
            <div className="flex items-center gap-2 text-white/60">
              <SpinnerIcon />
              <span className="text-sm">Thinking…</span>
            </div>
          )}
          {listening && interim && !error && !speechError && (
            <p className="text-sm italic text-white/40">{interim}</p>
          )}
        </div>

        <div className="flex items-center gap-6 px-6 pb-4 text-sm text-white/70">
          {actions.map(({ key, label }) => (
            <button
              key={key}
              disabled={loading}
              onClick={() => runManualAction(key)}
              className="transition-colors hover:text-white disabled:opacity-40"
            >
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
            <span className="text-[11px] text-white/40">⌘⏎ for Assist</span>
          </form>

          <div className="mt-2 flex items-center justify-end">
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || !question.trim()}
              className="flex size-8 items-center justify-center rounded-full text-white transition-opacity disabled:opacity-40"
              style={{ backgroundColor: accentColor }}
              aria-label="Send"
            >
              <PlayIcon small />
            </button>
          </div>
        </div>
      </div>

      {!speechSupported && (
        <p className="pointer-events-auto rounded-lg bg-black/60 px-3 py-1.5 text-xs text-white/50">
          Live listening needs Chrome or Edge.
        </p>
      )}

      {!listening && (
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={handleCalibrate}
            disabled={calibrating}
            className="rounded-lg bg-black/60 px-3 py-1.5 text-xs text-white/60 hover:text-white/90 disabled:opacity-60"
          >
            {calibrating
              ? "Listening…"
              : micBaseline !== null
                ? "Recalibrate voice ID"
                : "Calibrate voice ID (say who's you vs. them)"}
          </button>
          {calibrateMessage && (
            <span className="rounded-lg bg-black/60 px-3 py-1.5 text-xs text-white/60">{calibrateMessage}</span>
          )}
        </div>
      )}
    </div>
  )
}

function PlayIcon({ small }: { small?: boolean }) {
  const size = small ? 14 : 16
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function MicIcon({ pulsing }: { pulsing?: boolean }) {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={pulsing ? "animate-pulse" : ""}>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0M12 19v3" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="animate-spin">
      <path d="M21 12a9 9 0 1 1-9-9" strokeLinecap="round" />
    </svg>
  )
}
