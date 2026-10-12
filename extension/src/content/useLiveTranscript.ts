"use client"

import { useCallback, useRef, useState } from "react"

export function isSpeechRecognitionSupported() {
  if (typeof window === "undefined") return false
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
}

const FATAL_ERRORS: Record<string, string> = {
  "not-allowed": "Mic access was blocked — allow microphone access for this site and press play again.",
  "service-not-allowed":
    "This browser blocked the speech recognition service (Brave disables Google's speech backend by default — try Chrome, or enable it in your browser's privacy settings).",
  "audio-capture": "No microphone found — check that one is connected and selected.",
}

export function useLiveTranscript(onFinalSegment: (fullTranscript: string) => void) {
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState("")
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const transcriptRef = useRef("")
  const interimRef = useRef("")
  const wantsListeningRef = useRef(false)
  const lastActivityRef = useRef(0)
  const hasHeardRef = useRef(false)
  // Flips true once the browser has actually started capturing mic audio for this
  // recognition session (the onaudiostart event) — a real signal, not a guessed delay.
  // Anything else that also wants the mic (e.g. a separate getUserMedia call) should
  // wait for this before opening its own stream, or the two can race each other and
  // both come up empty (confirmed: this raced and failed intermittently in testing).
  const audioStartedRef = useRef(false)

  const start = useCallback(() => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Ctor) {
      setError("Live listening needs Chrome or Edge — this browser doesn't support speech recognition.")
      return
    }

    setError(null)
    wantsListeningRef.current = true
    lastActivityRef.current = Date.now()
    hasHeardRef.current = false
    audioStartedRef.current = false

    const recognition = new Ctor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onresult = (event) => {
      lastActivityRef.current = Date.now()
      hasHeardRef.current = true
      let interimText = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const text = result[0].transcript
        if (result.isFinal) {
          transcriptRef.current = `${transcriptRef.current} ${text}`.trim()
          onFinalSegment(transcriptRef.current)
        } else {
          interimText += text
        }
      }
      interimRef.current = interimText
      setInterim(interimText)
    }

    recognition.onerror = (event) => {
      const message = FATAL_ERRORS[event.error]
      if (message) {
        wantsListeningRef.current = false
        setError(message)
        setListening(false)
      }
      // other errors (no-speech, network) are transient — onend's auto-restart recovers
    }

    recognition.onaudiostart = () => {
      audioStartedRef.current = true
    }

    recognition.onend = () => {
      if (wantsListeningRef.current) {
        try {
          recognition.start()
        } catch {
          // already starting; ignore
        }
      } else {
        setListening(false)
      }
    }

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }, [onFinalSegment])

  const stop = useCallback(() => {
    wantsListeningRef.current = false
    audioStartedRef.current = false
    recognitionRef.current?.stop()
    setListening(false)
    setInterim("")
    interimRef.current = ""
  }, [])

  const reset = useCallback(() => {
    transcriptRef.current = ""
  }, [])

  return {
    listening,
    interim,
    error,
    start,
    stop,
    reset,
    transcriptRef,
    interimRef,
    lastActivityRef,
    hasHeardRef,
    audioStartedRef,
  }
}
