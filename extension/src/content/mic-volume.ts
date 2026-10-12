import { useEffect, useRef } from "react"

// Heuristic speaker ID: the rep's own voice hits the mic directly (loud), while the
// prospect's voice comes secondhand through the rep's speakers (quieter, roomier).
// This samples raw mic loudness (RMS) alongside the existing SpeechRecognition-based
// transcript, so a transcript chunk can be tagged "probably rep" vs "probably them"
// by comparing its average loudness against a one-time calibrated baseline.
// Approximate by nature — see the calibration UI copy for the caveat that ships with it.

interface VolumeSample {
  t: number
  level: number
}

async function openAnalyser() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const audioCtx = new AudioContext()
  const source = audioCtx.createMediaStreamSource(stream)
  const analyser = audioCtx.createAnalyser()
  analyser.fftSize = 2048
  source.connect(analyser)
  const dataArray = new Uint8Array(new ArrayBuffer(analyser.fftSize))
  return { stream, audioCtx, analyser, dataArray }
}

function readRms(analyser: AnalyserNode, dataArray: Uint8Array<ArrayBuffer>): number {
  analyser.getByteTimeDomainData(dataArray)
  let sumSquares = 0
  for (let i = 0; i < dataArray.length; i++) {
    const normalized = (dataArray[i] - 128) / 128
    sumSquares += normalized * normalized
  }
  return Math.sqrt(sumSquares / dataArray.length)
}

// One-off capture used by the "calibrate my voice" flow — opens its own mic stream,
// samples for `durationMs` while the rep talks, then tears everything down.
export async function sampleMicVolumeOnce(durationMs = 2500): Promise<number> {
  const { stream, audioCtx, analyser, dataArray } = await openAnalyser()
  const samples: number[] = []
  const start = Date.now()

  return new Promise((resolve) => {
    const interval = setInterval(() => {
      samples.push(readRms(analyser, dataArray))
      if (Date.now() - start >= durationMs) {
        clearInterval(interval)
        stream.getTracks().forEach((t) => t.stop())
        void audioCtx.close()
        resolve(samples.length ? samples.reduce((a, b) => a + b, 0) / samples.length : 0)
      }
    }, 100)
  })
}

// Continuous monitor kept alive for the duration of a call — records a rolling log of
// {timestamp, level} so the overlay can look back at "how loud was the mic between
// these two times" once a transcript chunk finalizes.
export function useMicVolumeMonitor(active: boolean) {
  const volumeLogRef = useRef<VolumeSample[]>([])

  useEffect(() => {
    if (!active) return
    let stopped = false
    let cleanup: (() => void) | null = null

    void (async () => {
      try {
        const { stream, audioCtx, analyser, dataArray } = await openAnalyser()
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop())
          void audioCtx.close()
          return
        }
        const interval = setInterval(() => {
          const log = volumeLogRef.current
          log.push({ t: Date.now(), level: readRms(analyser, dataArray) })
          if (log.length > 2000) log.splice(0, log.length - 2000)
        }, 100)
        cleanup = () => {
          clearInterval(interval)
          stream.getTracks().forEach((t) => t.stop())
          void audioCtx.close()
        }
      } catch {
        // Mic access unavailable for volume monitoring (e.g. permission denied) —
        // speaker tagging just silently stays off; transcription itself is unaffected.
      }
    })()

    return () => {
      stopped = true
      cleanup?.()
      volumeLogRef.current = []
    }
  }, [active])

  return volumeLogRef
}

export function getAverageLevel(log: VolumeSample[], fromTs: number, toTs: number): number | null {
  const relevant = log.filter((s) => s.t >= fromTs && s.t <= toTs)
  if (relevant.length === 0) return null
  return relevant.reduce((a, b) => a + b.level, 0) / relevant.length
}
