import { GoogleGenAI } from "@google/genai"
import { GoogleAuth } from "google-auth-library"
import { NOOP } from "./copilot-shared"

const API_KEY = process.env.GOOGLE_VERTEX_API_KEY
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || "us-central1"
// Flash-Lite trades a little reasoning depth for meaningfully faster time-to-first-token,
// which matters more than depth for a live-call tool reacting inside a few hundred ms.
const MODEL = process.env.GOOGLE_COPILOT_MODEL || "gemini-2.5-flash-lite"

// GOOGLE_CLOUD_PROJECT + a real service-account key (GOOGLE_APPLICATION_CREDENTIALS)
// takes priority whenever it's configured — this is billed against that project's
// Cloud Billing account (e.g. free-trial credit), unlike the Express Mode API key
// below, which runs on a separate always-free quota that never touches billing at all.
export const USE_BILLED_PROJECT = Boolean(PROJECT_ID)
export { PROJECT_ID, LOCATION, MODEL }

export const REQUEST_TIMEOUT_MS = 20_000

export async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    clearTimeout(timer!)
  }
}

// --- Billed-project path: mints a bearer token from the service account key and
// calls Vertex's REST endpoint directly (same approach proven to hit real billing
// in the Klimbins project's lib/vertex-gemini.ts). ---

// GOOGLE_APPLICATION_CREDENTIALS (a file path) only works on a machine that actually
// has that file — fine locally, but there's no such file on Vercel's servers and no
// way to ship one outside this repo. GOOGLE_SERVICE_ACCOUNT_JSON holds the same key's
// contents directly as an env var instead, so auth works identically in both places
// with no filesystem dependency at all. Prefer it when set; fall back to the file path
// for convenience during local dev.
const SERVICE_ACCOUNT_JSON = process.env.GOOGLE_SERVICE_ACCOUNT_JSON

const googleAuth = new GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  ...(SERVICE_ACCOUNT_JSON ? { credentials: JSON.parse(SERVICE_ACCOUNT_JSON) } : {}),
})

export async function getAccessToken(): Promise<string> {
  const client = await withTimeout(googleAuth.getClient(), REQUEST_TIMEOUT_MS, "Vertex AI auth")
  const { token } = await withTimeout(client.getAccessToken(), REQUEST_TIMEOUT_MS, "Vertex AI token mint")
  if (!token) throw new Error("Failed to mint a Vertex AI access token from the service account credentials")
  return token
}

interface VertexStreamCandidate {
  content?: { parts?: Array<{ text?: string }> }
}
interface VertexStreamResponse {
  candidates?: VertexStreamCandidate[]
}

async function* streamViaBilledProject(prompt: string): AsyncGenerator<string> {
  const token = await getAccessToken()

  const controller = new AbortController()
  const abortTimer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(
      `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:streamGenerateContent?alt=sse`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 256 },
        }),
        signal: controller.signal,
      },
    )
  } catch (err) {
    clearTimeout(abortTimer)
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Vertex AI stream request timed out after ${REQUEST_TIMEOUT_MS}ms`)
    }
    throw err
  }

  if (!response.ok || !response.body) {
    clearTimeout(abortTimer)
    throw new Error(`Vertex AI stream request failed: ${response.status} ${await response.text().catch(() => "")}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() || ""
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith("data:")) continue
        const jsonStr = trimmed.slice(5).trim()
        if (!jsonStr) continue
        let parsed: VertexStreamResponse
        try {
          parsed = JSON.parse(jsonStr) as VertexStreamResponse
        } catch {
          continue
        }
        const delta = (parsed.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("")
        if (delta) yield delta
      }
    }
  } finally {
    clearTimeout(abortTimer)
  }
}

async function pingBilledProject(): Promise<void> {
  const token = await getAccessToken()
  await fetch(
    `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "." }] }],
        generationConfig: { maxOutputTokens: 1 },
      }),
    },
  )
}

// --- Express Mode fallback: bare API key, no project/billing involved. Only used
// when GOOGLE_CLOUD_PROJECT isn't configured. ---

let expressClient: GoogleGenAI | null = null

export function getExpressClient() {
  if (expressClient) return expressClient
  if (!API_KEY) {
    throw new Error("Set either GOOGLE_CLOUD_PROJECT (+ GOOGLE_APPLICATION_CREDENTIALS) or GOOGLE_VERTEX_API_KEY in .env.local")
  }
  expressClient = new GoogleGenAI({ vertexai: true, apiKey: API_KEY })
  return expressClient
}

async function* streamViaExpressMode(prompt: string): AsyncGenerator<string> {
  const stream = await getExpressClient().models.generateContentStream({
    model: MODEL,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      maxOutputTokens: 256,
      temperature: 0.4,
      thinkingConfig: { thinkingBudget: 0 },
    },
  })
  for await (const chunk of stream) {
    if (chunk.text) yield chunk.text
  }
}

async function pingExpressMode(): Promise<void> {
  const stream = await getExpressClient().models.generateContentStream({
    model: MODEL,
    contents: ".",
    config: { maxOutputTokens: 1, thinkingConfig: { thinkingBudget: 0 } },
  })
  for await (const _chunk of stream) {
    // draining is enough — we only care that the connection stayed warm
  }
}

// The connection to Vertex goes cold if idle for even a short while (~10s to
// reconnect vs ~400ms warm — confirmed by timing the calls directly). A rep
// can easily go a minute without needing the copilot, so without this a real
// call would randomly eat a 10s hang right when it matters most. This keeps
// one lightweight request in flight periodically for as long as the server
// process is alive, trading a small constant trickle of API usage for
// consistently fast real responses.
declare global {
  // eslint-disable-next-line no-var
  var __copilotHeartbeatStarted: boolean | undefined
}

function startHeartbeat() {
  if (globalThis.__copilotHeartbeatStarted) return
  globalThis.__copilotHeartbeatStarted = true

  setInterval(() => {
    const ping = USE_BILLED_PROJECT ? pingBilledProject() : pingExpressMode()
    ping.catch(() => {
      // transient heartbeat failures are fine; the next real request will just pay the cold cost once
    })
  }, 4000)
}

if (USE_BILLED_PROJECT || API_KEY) {
  startHeartbeat()
}

const SYSTEM_PROMPT = `You are the live-call copilot overlaid on a video call, watching a live sales conversation in real time on behalf of the person using the app (call them "the rep"). The stakes are real: this is a sales call, the other party is the prospect, and a slow or wrong response can lose the deal. The transcript below is everything said so far, live, via speech-to-text (expect occasional transcription typos — read through them).

Some lines may be prefixed "REP:" or "PROSPECT:" — a best-effort guess based on mic loudness (the rep's own voice hits the mic directly; the prospect's comes through the rep's speakers, quieter). Treat these as a strong hint, not certain fact: weight PROSPECT-labeled lines as what you're primarily reacting to, and don't mistake REP-labeled lines for something the prospect said. Unlabeled lines (no calibration done yet) should be read the same way you always have — from context, without assuming a speaker.

Rules for every reply:
- Talk like a sharp, casual friend texting the rep under the table — not a consultant. Contractions, plain words, no corporate speak ("I recommend," "you should consider," "it's important to"). Just say the thing.
- Speak directly to the rep, not about them. Never say "the rep should..." — say "you could..." or just give the line to say.
- Keep each individual point short enough to read in 2-3 seconds at a glance: 1-3 sentences, no preamble, no "Here's what I think" throat-clearing.
- Be concrete and usable immediately — a real number, a real phrase, a real next step. Not generic advice.
- No markdown headers or bullet walls unless the mode below asks for a list.
- If the transcript doesn't give you enough to be specific, say the single most useful clarifying thing rather than a hedge.
- If the moment actually has more than one distinct thing worth flagging (e.g. the prospect raised two separate objections back to back, or asked two different questions), address each one — don't silently drop one to focus on the other. Keep each point tight; a couple of short back-to-back points beats one polished paragraph that ignores the second thing.

You will be told which mode to respond in:

ASSIST — Answer the substantive question just asked or explain the concept just raised, the way a sharp colleague would text it to the rep under the table. Factual, confident, no hedging.

WHAT_SHOULD_I_SAY — Give the rep an actual line of dialogue they can say out loud right now, in quotes. One option, their voice, not a script.

FOLLOW_UP_QUESTIONS — Give exactly 2-3 short, sharp questions the rep could ask next to move the deal forward. Plain numbered list, no explanation per item.

RECAP — Summarize what's been covered on the call so far in 2-3 sentences, oriented toward what the rep needs to remember or act on, not a transcript rehash.

AUTO_LISTEN — You are running continuously in the background while the rep talks, not on demand. You'll be shown the full transcript and, separately, the newest chunk since your last check. Decide first whether the newest chunk actually needs you:
  - React when the prospect raises an objection ("too expensive", "need to check with my team", "using a competitor", "not sure this is a priority"), asks a pointed question, states a number (budget, timeline, headcount) worth acknowledging, or the rep visibly stumbles/goes quiet on something answerable.
  - Do NOT react to small talk, agreement, filler ("yeah", "makes sense", "okay cool"), or the rep already handling something well on their own.
  - If the newest chunk contains multiple separate things worth reacting to (e.g. two objections in a row, or an objection plus a question), cover all of them in one reply — one short line per point. Never answer only the first one and drop the rest; that's worse than answering neither well.
  - If it needs you: give the rep the single most useful thing (or things, per above) to say or know right now — treat it like WHAT_SHOULD_I_SAY when a line of dialogue helps most, or a sharp factual answer when information is what's missing. Whichever the moment calls for.
  - If it does NOT need you: reply with exactly this token and nothing else: ${NOOP}
  Bias toward silence — interrupting with a low-value response is worse than staying quiet. Only speak up when it would clearly help the rep in the next 10 seconds.

If the rep also typed their own question, treat it as the most direct signal of what they need and answer that (mode ASSIST applies), using the transcript only as background context.

You may also be given the rep's own sales materials below (the offer, a call script, a list of known objections and how to handle them). When present, ground every answer in that material first — prefer the rep's actual pricing, positioning, and pre-written objection responses over generic sales advice. Adapt their language to the moment rather than reciting it verbatim, and only fall back to general best practice where the materials don't cover the situation.`

export interface SalesContext {
  offer?: string
  script?: string
  objections?: string
}

function buildUserPrompt(
  action: string,
  question: string,
  transcript: string,
  recentSegment: string,
  context?: SalesContext,
) {
  const modeLabel = action.toUpperCase().replace(/\s+/g, "_")
  const lines: string[] = []

  if (context?.offer || context?.script || context?.objections) {
    lines.push("=== REP'S SALES MATERIALS ===")
    if (context.offer) lines.push("THE OFFER (what the rep is selling):", context.offer.trim(), "")
    if (context.script) lines.push("CALL SCRIPT:", context.script.trim(), "")
    if (context.objections) lines.push("KNOWN OBJECTIONS & HANDLING:", context.objections.trim(), "")
    lines.push("=== END SALES MATERIALS ===", "")
  }

  lines.push(
    `MODE: ${modeLabel}`,
    "",
    "FULL TRANSCRIPT SO FAR:",
    transcript.trim() || "(no transcript captured yet)",
  )
  if (modeLabel === "AUTO_LISTEN") {
    lines.push("", "NEWEST CHUNK SINCE LAST CHECK:", recentSegment.trim() || "(nothing new)")
  }
  lines.push(
    "",
    question
      ? `REP'S TYPED QUESTION: ${question}`
      : "(the rep did not type a question — just respond to the mode above using the transcript)",
  )
  return lines.join("\n")
}

export async function* streamCopilotReply({
  action,
  question = "",
  transcript = "",
  recentSegment = "",
  context,
}: {
  action: string
  question?: string
  transcript?: string
  recentSegment?: string
  context?: SalesContext
}): AsyncGenerator<string> {
  const prompt = buildUserPrompt(action, question, transcript, recentSegment, context)
  if (USE_BILLED_PROJECT) {
    yield* streamViaBilledProject(prompt)
  } else {
    yield* streamViaExpressMode(prompt)
  }
}
