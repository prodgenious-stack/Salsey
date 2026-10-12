// One-shot (non-streaming) structured analysis of a finished call — runs once when a
// transcript is saved, separate from the live streaming copilot in copilot-ai.ts.
// Reuses the same billed-project auth / Express Mode fallback so it draws from the
// same credit pool and never needs its own setup.
import {
  getAccessToken,
  getExpressClient,
  LOCATION,
  MODEL,
  PROJECT_ID,
  REQUEST_TIMEOUT_MS,
  USE_BILLED_PROJECT,
  withTimeout,
} from "./copilot-ai"

export const OBJECTION_CATEGORIES = ["price", "timing", "competitor", "authority", "trust", "need", "other"] as const
export type ObjectionCategory = (typeof OBJECTION_CATEGORIES)[number]

export interface CallObjection {
  category: ObjectionCategory
  quote: string
  handled_well: boolean
  note: string
}

export interface CallRecap {
  summary: string
  next_steps: string
  sentiment: "positive" | "neutral" | "negative"
  objections: CallObjection[]
  company: string | null
  contact_name: string | null
}

const RECAP_SYSTEM_PROMPT = `You analyze a finished sales call transcript (captured live via speech-to-text, so expect occasional typos) and return a structured recap for the rep to review later. Be concrete and specific to what was actually said — never generic sales advice. If the transcript is too short or unclear to say something specific, say so plainly rather than inventing detail.

Some lines may be prefixed "REP:" or "PROSPECT:" — a best-effort guess based on mic loudness, not certain fact. Use them as a strong hint for attributing objections to the prospect specifically, but don't be thrown off if a line's label looks wrong given the surrounding context — trust the conversation's actual content over the label when they conflict. Transcripts with no labels at all mean calibration wasn't done for that call; read speaker turns from context as usual.

For each objection field: "category" must be exactly one of ${OBJECTION_CATEGORIES.join(", ")} (pick the closest fit; use "other" only if truly nothing fits). "quote" is the prospect's actual words (lightly cleaned up, not paraphrased into something they didn't say). "handled_well" is your honest judgment of whether the rep's response actually addressed it. "note" is one short, specific sentence on what worked or what the rep could have said instead.

Only include real objections the prospect actually raised — do not manufacture objections that didn't happen. If none came up, return an empty objections array.

Also try to pull out "company" (the prospect's company name) and "contact_name" (the prospect's name) if either was actually said in the transcript. Use null for either one you can't find — never guess or invent a plausible-sounding name.`

const RECAP_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    next_steps: { type: "string" },
    sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
    company: { type: "string", nullable: true },
    contact_name: { type: "string", nullable: true },
    objections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          category: { type: "string", enum: [...OBJECTION_CATEGORIES] },
          quote: { type: "string" },
          handled_well: { type: "boolean" },
          note: { type: "string" },
        },
        required: ["category", "quote", "handled_well", "note"],
      },
    },
  },
  required: ["summary", "next_steps", "sentiment", "objections", "company", "contact_name"],
}

interface VertexGenerateResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
}

async function callBilledProjectJson(prompt: string): Promise<string> {
  const token = await getAccessToken()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const res = await fetch(
      `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: RECAP_SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
            responseMimeType: "application/json",
            responseSchema: RECAP_SCHEMA,
          },
        }),
        signal: controller.signal,
      },
    )
    if (!res.ok) throw new Error(`Recap request failed: ${res.status} ${await res.text().catch(() => "")}`)
    const data = (await res.json()) as VertexGenerateResponse
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") ?? ""
    if (!text) throw new Error("No text in recap response")
    return text
  } finally {
    clearTimeout(timer)
  }
}

async function callExpressModeJson(prompt: string): Promise<string> {
  const result = await withTimeout(
    getExpressClient().models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        systemInstruction: RECAP_SYSTEM_PROMPT,
        temperature: 0.2,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
        responseSchema: RECAP_SCHEMA,
      },
    }),
    REQUEST_TIMEOUT_MS,
    "Recap generation",
  )
  const text = result.text
  if (!text) throw new Error("No text in recap response")
  return text
}

export async function generateCallRecap(transcript: string): Promise<CallRecap> {
  const prompt = `TRANSCRIPT:\n${transcript.trim()}`
  const raw = USE_BILLED_PROJECT ? await callBilledProjectJson(prompt) : await callExpressModeJson(prompt)
  const parsed = JSON.parse(raw) as CallRecap
  // Defensive normalization — a model deviating from the schema shouldn't crash the save.
  return {
    summary: parsed.summary ?? "",
    next_steps: parsed.next_steps ?? "",
    sentiment: parsed.sentiment ?? "neutral",
    objections: Array.isArray(parsed.objections) ? parsed.objections : [],
    company: parsed.company ?? null,
    contact_name: parsed.contact_name ?? null,
  }
}
