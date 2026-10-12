import { AbsoluteFill, Easing, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion"
import { loadFont } from "@remotion/google-fonts/Inter"

const { fontFamily } = loadFont("normal", { weights: ["400", "500", "600"], subsets: ["latin"] })

// Source clips are 294 frames (AI-upscaled 4x with Real-ESRGAN); slowed to fill 12.5s.
const PLAYBACK = 294 / 375
export const HERO_FRAMES = 375

const LIME = "#F2F79E"
const BG = "#141F22"

// ── Timeline (frames @ 30fps) ───────────────────────────────────────────────
const T = {
  pillIn: 30,
  zoomIn: [70, 102],
  panelIn: 96,
  streamStart: 128,
  streamEnd: 172,
  panDown: [140, 182],
  explain: 188,
  zoomOut: [250, 288],
  panelOut: [258, 280],
  youCaption: 276,
  outro: [344, 372],
} as const

const SUGGESTION = "Totally — notes tell you what happened. We help you in the moment, while the deal's still live."
const PROSPECT_LINE = "We already use a notetaker. Not sure we need another tool."
const YOU_LINE = "Totally — notes tell you what happened. We help you in the moment."

const smooth = Easing.bezier(0.65, 0, 0.35, 1)
const out = Easing.bezier(0.22, 1, 0.36, 1)

function tween(f: number, range: readonly [number, number], to: [number, number], easing = smooth) {
  return interpolate(f, range as [number, number], to, { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" })
}

/** Piecewise keyframes with the same ease on every segment. */
function keys(f: number, frames: number[], values: number[]) {
  for (let i = 0; i < frames.length - 1; i++) {
    if (f <= frames[i + 1]) return tween(f, [frames[i], frames[i + 1]], [values[i], values[i + 1]])
  }
  return values[values.length - 1]
}

// ── Stage layout (1920×1080 coordinates) ───────────────────────────────────
const TILE = { w: 924, h: 896, top: 92, gap: 20 }
const TILE_LEFT = (1920 - TILE.w * 2 - TILE.gap) / 2
const PANEL = { w: 760, top: 224 }
const ZOOM = 1.85

export function Hero() {
  const f = useCurrentFrame()

  const scale = keys(f, [0, T.zoomIn[0], T.zoomIn[1], T.zoomOut[0], T.zoomOut[1]], [1, 1.02, ZOOM, ZOOM, 1])
  const cy = keys(f, [0, T.zoomIn[0], T.zoomIn[1], T.panDown[0], T.panDown[1], T.zoomOut[0], T.zoomOut[1]], [540, 540, 384, 384, 428, 428, 540])
  const cx = 960
  const zoomed = (scale - 1) / (ZOOM - 1)

  return (
    <AbsoluteFill style={{ backgroundColor: BG, fontFamily, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transformOrigin: "0 0",
          transform: `translate(${960 - cx * scale}px, ${540 - cy * scale}px) scale(${scale})`,
        }}
      >
        <Backdrop />
        <Tile src="tile-you.mp4" left={TILE_LEFT} name="You" dim={zoomed} speaking={speakingLevel(f, T.youCaption, 340)} />
        <Tile
          src="tile-prospect.mp4"
          left={TILE_LEFT + TILE.w + TILE.gap}
          name="Prospect"
          dim={zoomed}
          speaking={speakingLevel(f, 0, 76)}
        />
        <Caption speaker="Prospect" text={PROSPECT_LINE} start={6} wordsEnd={62} end={112} />
        <Caption speaker="You" text={YOU_LINE} start={T.youCaption} wordsEnd={T.youCaption + 52} end={T.outro[1]} />
        <Pill />
        <Panel />
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

function speakingLevel(f: number, start: number, end: number) {
  return Math.min(tween(f, [start, start + 8], [0, 1], out), tween(f, [end - 10, end], [1, 0]))
}

function Backdrop() {
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 60% 50% at 50% 0%, rgba(242,247,158,0.10), transparent 70%), ${BG}`,
      }}
    />
  )
}

function Tile({ src, left, name, dim, speaking }: { src: string; left: number; name: string; dim: number; speaking: number }) {
  const f = useCurrentFrame()
  return (
    <div
      style={{
        position: "absolute",
        left,
        top: TILE.top,
        width: TILE.w,
        height: TILE.h,
        borderRadius: 30,
        overflow: "hidden",
        backgroundColor: "#0E1517",
        boxShadow: `0 0 0 ${3 * speaking}px rgba(242,247,158,${0.85 * speaking}), 0 30px 80px rgba(0,0,0,0.35)`,
      }}
    >
      <OffthreadVideo
        src={staticFile(src)}
        muted
        playbackRate={PLAYBACK}
        style={{ width: "100%", height: "100%", objectFit: "cover", filter: `brightness(${1 - 0.32 * dim}) saturate(${1 - 0.15 * dim})` }}
      />
      <div
        style={{
          position: "absolute",
          left: 22,
          bottom: 22,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 18px 10px 14px",
          borderRadius: 999,
          backgroundColor: "rgba(10,14,15,0.55)",
          backdropFilter: "blur(18px)",
          color: "white",
          fontSize: 22,
          fontWeight: 500,
        }}
      >
        <Bars level={speaking} frame={f} />
        {name}
      </div>
    </div>
  )
}

/** Small audio bars next to a name — flat when quiet, moving when speaking. */
function Bars({ level, frame }: { level: number; frame: number }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 3, height: 20, width: 20 }}>
      {[0, 1, 2].map((i) => {
        const wave = 0.5 + 0.5 * Math.sin(frame * 0.55 + i * 1.9)
        const h = 5 + level * (6 + 9 * wave)
        return <span key={i} style={{ width: 4, height: h, borderRadius: 4, backgroundColor: level > 0.05 ? LIME : "rgba(255,255,255,0.7)" }} />
      })}
    </span>
  )
}

function Caption({ speaker, text, start, wordsEnd, end }: { speaker: string; text: string; start: number; wordsEnd: number; end: number }) {
  const f = useCurrentFrame()
  const words = text.split(" ")
  const opacity = Math.min(tween(f, [start, start + 10], [0, 1], out), tween(f, [end - 14, end], [1, 0]))
  if (opacity <= 0) return null
  const lift = tween(f, [start, start + 14], [14, 0], out)
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 836,
        display: "flex",
        justifyContent: "center",
        opacity,
        transform: `translateY(${lift}px)`,
      }}
    >
      <div
        style={{
          maxWidth: 1360,
          padding: "16px 28px",
          borderRadius: 22,
          backgroundColor: "rgba(10,14,15,0.62)",
          backdropFilter: "blur(22px) saturate(140%)",
          color: "white",
          fontSize: 30,
          lineHeight: 1.35,
          letterSpacing: "-0.01em",
        }}
      >
        <span style={{ color: LIME, fontWeight: 600, marginRight: 14 }}>{speaker}</span>
        {words.map((word, i) => {
          const at = start + 4 + ((wordsEnd - start - 4) * i) / words.length
          const o = tween(f, [at, at + 5], [0, 1], out)
          return (
            <span key={i} style={{ opacity: o }}>
              {word}
              {i < words.length - 1 ? " " : ""}
            </span>
          )
        })}
      </div>
    </div>
  )
}

const glass: React.CSSProperties = {
  backgroundColor: "rgba(12,17,18,0.58)",
  backdropFilter: "blur(28px) saturate(160%)",
  WebkitBackdropFilter: "blur(28px) saturate(160%)",
}

function Pill() {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const enter = spring({ frame: f - T.pillIn, fps, config: { damping: 18, stiffness: 140, mass: 0.8 } })
  const leave = tween(f, T.outro, [0, 1])
  const opacity = Math.min(1, enter * 1.4) * (1 - leave)
  if (opacity <= 0) return null
  const pulse = 0.5 + 0.5 * Math.sin(f * 0.18)

  const circle: React.CSSProperties = {
    width: 54,
    height: 54,
    borderRadius: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
  }

  return (
    <div
      style={{
        position: "absolute",
        left: 960,
        top: 132,
        transform: `translate(-50%, ${(1 - enter) * -28 - leave * 10}px) scale(${0.92 + 0.08 * enter})`,
        opacity,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.16)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), 0 18px 50px rgba(0,0,0,0.45)",
        ...glass,
      }}
    >
      <span style={{ ...circle, backgroundColor: "rgba(239,68,68,0.78)", boxShadow: `0 0 0 ${6 * pulse}px rgba(239,68,68,${0.25 * (1 - pulse)})` }}>
        <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="9" y="2" width="6" height="12" rx="3" />
          <path d="M5 10a7 7 0 0 0 14 0M12 19v3" strokeLinecap="round" />
        </svg>
      </span>
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 20px",
          borderRadius: 999,
          backgroundColor: "rgba(255,255,255,0.10)",
          color: "white",
          fontSize: 22,
          fontWeight: 500,
        }}
      >
        <img src={staticFile("salsey-icon-white.png")} style={{ width: 20, height: 20 }} />
        Live
      </span>
      <span style={{ ...circle, backgroundColor: "rgba(255,255,255,0.10)" }}>
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
        </svg>
      </span>
    </div>
  )
}

function Panel() {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const enter = spring({ frame: f - T.panelIn, fps, config: { damping: 20, stiffness: 120 } })
  const leave = tween(f, T.panelOut, [0, 1])
  const opacity = Math.min(1, enter * 1.3) * (1 - leave)
  if (opacity <= 0) return null

  const thinking = tween(f, [T.streamStart - 2, T.streamStart + 5], [1, 0])
  const bodyH = tween(f, [T.streamStart - 4, T.streamStart + 12], [52, 140], out)
  const explainH = tween(f, [T.explain, T.explain + 18], [0, 112], out)
  const explainO = tween(f, [T.explain + 6, T.explain + 20], [0, 1], out)
  const words = SUGGESTION.split(" ")
  const shimmerX = ((f * 9) % 520) - 160

  return (
    <div
      style={{
        position: "absolute",
        left: 960 - PANEL.w / 2,
        top: PANEL.top,
        width: PANEL.w,
        transformOrigin: "50% 0%",
        transform: `translateY(${(1 - enter) * -18 - leave * 16}px) scale(${0.96 + 0.04 * enter - 0.03 * leave})`,
        opacity,
        filter: `blur(${(1 - Math.min(1, enter)) * 6 + leave * 6}px)`,
        borderRadius: 34,
        overflow: "hidden",
        border: "1.5px solid rgba(242,247,158,0.38)",
        boxShadow: "0 0 0 1px rgba(242,247,158,0.12), 0 30px 90px rgba(0,0,0,0.55)",
        color: "white",
        ...glass,
      }}
    >
      <div style={{ padding: "30px 34px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 19, lineHeight: "28px", color: "rgba(255,255,255,0.45)" }}>
          <span
            style={{
              padding: "3px 12px",
              borderRadius: 999,
              backgroundColor: LIME,
              color: BG,
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            Objection
          </span>
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Responding to (them): “We already use a notetaker…”
          </span>
        </div>

        <div style={{ position: "relative", height: bodyH, marginTop: 18 }}>
          {thinking > 0 && (
            <div style={{ position: "absolute", top: 8, display: "flex", alignItems: "center", gap: 12, opacity: thinking, fontSize: 22 }}>
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2.2} style={{ transform: `rotate(${f * 14}deg)` }}>
                <path d="M21 12a9 9 0 1 1-9-9" strokeLinecap="round" />
              </svg>
              <span
                style={{
                  backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0.45) ${shimmerX - 60}px, rgba(255,255,255,1) ${shimmerX}px, rgba(255,255,255,0.45) ${shimmerX + 60}px)`,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                Thinking…
              </span>
            </div>
          )}
          <p style={{ margin: 0, fontSize: 33, lineHeight: "46px", letterSpacing: "-0.012em", fontWeight: 500, textWrap: "balance" }}>
            {words.map((word, i) => {
              const at = T.streamStart + ((T.streamEnd - T.streamStart) * i) / words.length
              const o = tween(f, [at, at + 6], [0, 1], out)
              return (
                <span key={i} style={{ opacity: o, filter: `blur(${(1 - o) * 4}px)` }}>
                  {i === 0 ? "“" : ""}
                  {word}
                  {i === words.length - 1 ? "”" : " "}
                </span>
              )
            })}
          </p>
        </div>

        <div style={{ height: explainH, overflow: "hidden" }}>
          <div
            style={{
              marginTop: 20,
              opacity: explainO,
              transform: `translateY(${(1 - explainO) * 10}px)`,
              padding: "16px 20px",
              borderRadius: 18,
              backgroundColor: "rgba(242,247,158,0.08)",
              border: "1px solid rgba(242,247,158,0.18)",
              fontSize: 20,
              lineHeight: "30px",
              color: "rgba(255,255,255,0.75)",
            }}
          >
            <span style={{ color: LIME, fontWeight: 600 }}>Why it works · </span>
            Agree first, then reframe on timing. Notes look back — Salsey helps while you&apos;re still talking.
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 30,
          padding: "18px 34px 22px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          fontSize: 18,
          color: "rgba(255,255,255,0.55)",
        }}
      >
        <span>Assist</span>
        <span>What should I say?</span>
        <span>Follow-up questions</span>
        <span>Recap</span>
      </div>
    </div>
  )
}
