import { getSalesContext } from "../shared/storage"
import { getValidAccessToken } from "../shared/supabase-auth"
import { API_BASE_URL, COPILOT_PORT_NAME, type CopilotPortMessage, type CopilotRequest } from "../shared/types"

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== COPILOT_PORT_NAME) return

  port.onMessage.addListener(async (request: CopilotRequest) => {
    const post = (msg: CopilotPortMessage) => {
      try {
        port.postMessage(msg)
      } catch {
        // popup/content script side went away — nothing to do
      }
    }

    try {
      const context = await getSalesContext()
      const res = await fetch(`${API_BASE_URL}/api/copilot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...request, context }),
      })

      if (!res.ok || !res.body) {
        post({ type: "error", message: `Request failed (${res.status}).` })
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        post({ type: "chunk", text: decoder.decode(value, { stream: true }) })
      }
      post({ type: "done" })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      post({ type: "error", message: `Couldn't reach the copilot backend — ${message}` })
    }
  })
})

// One-off message (not the streaming port above) sent by the content script when the rep
// stops listening — saves the call transcript if they're signed in, silently no-ops otherwise.
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "save-transcript") return
  ;(async () => {
    const transcript = typeof message.transcript === "string" ? message.transcript.trim() : ""
    if (!transcript) return sendResponse({ saved: false, reason: "empty" })

    const accessToken = await getValidAccessToken()
    if (!accessToken) return sendResponse({ saved: false, reason: "not-signed-in" })

    try {
      const res = await fetch(`${API_BASE_URL}/api/transcripts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ transcript }),
      })
      if (!res.ok) return sendResponse({ saved: false, reason: `http-${res.status}` })
      sendResponse({ saved: true })
    } catch (err) {
      sendResponse({ saved: false, reason: err instanceof Error ? err.message : "unknown" })
    }
  })()
  return true // keep the message channel open for the async sendResponse above
})
