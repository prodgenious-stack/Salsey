import { streamCopilotReply } from "@/lib/copilot-ai"

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body || typeof body.action !== "string") {
    return new Response("Missing action", { status: 400 })
  }

  const encoder = new TextEncoder()
  let closed = false

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const safeEnqueue = (text: string) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(text))
        } catch {
          // client disconnected mid-stream — nothing left to do
          closed = true
        }
      }

      try {
        for await (const chunk of streamCopilotReply({
          action: body.action,
          question: typeof body.question === "string" ? body.question : "",
          transcript: typeof body.transcript === "string" ? body.transcript : "",
          recentSegment: typeof body.recentSegment === "string" ? body.recentSegment : "",
          context: body.context && typeof body.context === "object" ? body.context : undefined,
        })) {
          safeEnqueue(chunk)
        }
      } catch (err) {
        console.error("copilot stream error", err)
        const message = err instanceof Error ? err.message : "Unknown error"
        safeEnqueue(` ERROR:${message}`)
      } finally {
        if (!closed) {
          closed = true
          try {
            controller.close()
          } catch {
            // already closed by the platform (e.g. client aborted) — fine
          }
        }
      }
    },
    cancel() {
      // client (browser) aborted the request — stop treating the controller as writable
      closed = true
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  })
}
