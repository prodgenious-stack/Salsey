// Real pattern-detection over a user's own call history — not hardcoded copy. One
// Gemini call per request; the Overview page caches it client-side per session.
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

export interface Insight {
  title: string
  body: string
}

const INSIGHTS_SYSTEM_PROMPT = `You look at aggregate objection-handling data across a sales rep's saved calls and surface 2-3 short, specific patterns worth their attention — the kind of thing a sharp sales manager would point out. Each insight is a short punchy headline (under 12 words) plus one sentence of supporting detail using the actual numbers given. Never invent numbers not present in the data. If the data is too thin to say anything specific and non-obvious, return fewer insights (even zero) rather than padding with generic advice.`

const INSIGHTS_SCHEMA = {
  type: "object",
  properties: {
    insights: {
      type: "array",
      items: {
        type: "object",
        properties: { title: { type: "string" }, body: { type: "string" } },
        required: ["title", "body"],
      },
    },
  },
  required: ["insights"],
}

interface VertexGenerateResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
}

function buildPrompt(objectionSummary: unknown, recentCallSummaries: string[]): string {
  return [
    "OBJECTION SUMMARY (by category, across all saved calls):",
    JSON.stringify(objectionSummary, null, 2),
    "",
    "RECENT CALL SUMMARIES:",
    ...recentCallSummaries.map((s, i) => `${i + 1}. ${s}`),
  ].join("\n")
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
          systemInstruction: { parts: [{ text: INSIGHTS_SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 512,
            responseMimeType: "application/json",
            responseSchema: INSIGHTS_SCHEMA,
          },
        }),
        signal: controller.signal,
      },
    )
    if (!res.ok) throw new Error(`Insights request failed: ${res.status} ${await res.text().catch(() => "")}`)
    const data = (await res.json()) as VertexGenerateResponse
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") ?? ""
    if (!text) throw new Error("No text in insights response")
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
        systemInstruction: INSIGHTS_SYSTEM_PROMPT,
        temperature: 0.3,
        maxOutputTokens: 512,
        responseMimeType: "application/json",
        responseSchema: INSIGHTS_SCHEMA,
      },
    }),
    REQUEST_TIMEOUT_MS,
    "Insights generation",
  )
  const text = result.text
  if (!text) throw new Error("No text in insights response")
  return text
}

export async function generateInsights(objectionSummary: unknown, recentCallSummaries: string[]): Promise<Insight[]> {
  const prompt = buildPrompt(objectionSummary, recentCallSummaries)
  const raw = USE_BILLED_PROJECT ? await callBilledProjectJson(prompt) : await callExpressModeJson(prompt)
  const parsed = JSON.parse(raw) as { insights?: Insight[] }
  return Array.isArray(parsed.insights) ? parsed.insights : []
}
