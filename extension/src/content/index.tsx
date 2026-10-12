import { createRoot } from "react-dom/client"
import CallCopilotOverlay from "./CallCopilotOverlay"
import overlayCss from "./overlay.css?inline"
import { getOverlayPosition } from "../shared/storage"

const HOST_ID = "live-call-copilot-root"

async function mount() {
  if (document.getElementById(HOST_ID)) return

  const hostEl = document.createElement("div")
  hostEl.id = HOST_ID
  hostEl.style.cssText = "position:fixed; top:16px; left:50%; transform:translateX(-50%); z-index:2147483647;"
  document.documentElement.appendChild(hostEl)

  const savedPosition = await getOverlayPosition()
  if (savedPosition) {
    hostEl.style.top = `${savedPosition.top}px`
    hostEl.style.left = `${savedPosition.left}px`
    hostEl.style.transform = "none"
  }

  const shadow = hostEl.attachShadow({ mode: "open" })

  const style = document.createElement("style")
  style.textContent = overlayCss
  shadow.appendChild(style)

  const appRoot = document.createElement("div")
  shadow.appendChild(appRoot)

  const root = createRoot(appRoot)
  root.render(<CallCopilotOverlay onClose={handleClose} hostId={HOST_ID} />)

  function handleClose() {
    root.unmount()
    hostEl.remove()
  }
}

function unmount() {
  document.getElementById(HOST_ID)?.remove()
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "toggle-copilot") {
    if (document.getElementById(HOST_ID)) {
      unmount()
    } else {
      mount()
    }
  }
})
