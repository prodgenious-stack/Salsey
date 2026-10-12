// On-demand rebuttal generation for one objection category — a real Gemini call per
// request (not cached/precomputed), so "Regenerate" on the Objections page actually
// regenerates. Reuses the same billed-project auth as copilot-ai.ts and call-recap.ts.
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

const REBUTTAL_SYSTEM_PROMPT = `You write a short, concrete rebuttal a sales rep can actually say the next time a specific objection category comes up. You'll be given the category and real quotes from prospects who raised it on past calls. Ground the rebuttal in the actual pattern in those quotes — don't give generic sales-training advice. 2-4 sentences, plain language, no markdown, no preamble. If given no quotes, say plainly that there isn't enough data yet rather than inventing a rebuttal from nothing.`

interface VertexGenerateResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
}

function buildPrompt(category: string, quotes: string[]): string {
  const lines = [`OBJECTION CATEGORY: ${category}`, ""]
  if (quotes.length > 0) {
    lines.push("REAL QUOTES FROM PROSPECTS:")
    quotes.forEach((q) => lines.push(`- "${q}"`))
  } else {
    lines.push("(no quotes captured yet for this category)")
  }
  return lines.join("\n")
}

async function callBilledProject(prompt: string): Promise<string> {
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
          systemInstruction: { parts: [{ text: REBUTTAL_SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 300 },
        }),
        signal: controller.signal,
      },
    )
    if (!res.ok) throw new Error(`Rebuttal request failed: ${res.status} ${await res.text().catch(() => "")}`)
    const data = (await res.json()) as VertexGenerateResponse
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") ?? ""
    if (!text) throw new Error("No text in rebuttal response")
    return text.trim()
  } finally {
    clearTimeout(timer)
  }
}

async function callExpressMode(prompt: string): Promise<string> {
  const result = await withTimeout(
    getExpressClient().models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { systemInstruction: REBUTTAL_SYSTEM_PROMPT, temperature: 0.5, maxOutputTokens: 300 },
    }),
    REQUEST_TIMEOUT_MS,
    "Rebuttal generation",
  )
  const text = result.text
  if (!text) throw new Error("No text in rebuttal response")
  return text.trim()
}

export async function generateRebuttal(category: string, quotes: string[]): Promise<string> {
  const prompt = buildPrompt(category, quotes)
  return USE_BILLED_PROJECT ? callBilledProject(prompt) : callExpressMode(prompt)
}
