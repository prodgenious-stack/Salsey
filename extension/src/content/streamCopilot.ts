import { COPILOT_PORT_NAME, type CopilotPortMessage } from "../shared/types"

export function streamCopilot(
  action: string,
  question: string,
  recentSegment: string,
  transcript: string,
  onChunk: (chunk: string) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const port = chrome.runtime.connect({ name: COPILOT_PORT_NAME })

    port.onMessage.addListener((msg: CopilotPortMessage) => {
      if (msg.type === "chunk") {
        onChunk(msg.text)
      } else if (msg.type === "done") {
        port.disconnect()
        resolve()
      } else if (msg.type === "error") {
        port.disconnect()
        reject(new Error(msg.message))
      }
    })

    port.onDisconnect.addListener(() => {
      // resolved/rejected already if we got a done/error message; this covers
      // the extension context itself going away (e.g. reload during dev)
    })

    port.postMessage({ action, question, recentSegment, transcript })
  })
}
