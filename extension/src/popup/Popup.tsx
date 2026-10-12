import { useEffect, useRef, useState } from "react"
import { getSalesContext, getSettings, setSalesContext, setSettings } from "../shared/storage"
import { DEFAULT_SETTINGS, EMPTY_SALES_CONTEXT, type CopilotSettings, type SalesContext } from "../shared/types"
import AccountSection from "./AccountSection"

const PRESET_COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#ec4899", "#ffffff"]

type FieldKey = keyof SalesContext

const FIELDS: { key: FieldKey; label: string; placeholder: string; allowUpload?: boolean }[] = [
  {
    key: "offer",
    label: "The offer",
    placeholder: "What you're selling, pricing, packages, who it's for, key differentiators…",
    allowUpload: true,
  },
  {
    key: "script",
    label: "Call script",
    placeholder: "Your talk track — opening, discovery questions, pitch structure, close…",
  },
  {
    key: "objections",
    label: "Common objections & handling",
    placeholder: `"Too expensive" -> ...\n"Need to check with my team" -> ...\n"Using a competitor" -> ...`,
  },
]

export default function Popup() {
  const [context, setContext] = useState<SalesContext>(EMPTY_SALES_CONTEXT)
  const [settings, setSettingsState] = useState<CopilotSettings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [toggleError, setToggleError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([getSalesContext(), getSettings()]).then(([c, s]) => {
      setContext(c)
      setSettingsState(s)
      setLoaded(true)
    })
  }, [])

  async function handleSave() {
    await Promise.all([setSalesContext(context), setSettings(settings)])
    setSavedAt(Date.now())
  }

  async function handleColorChange(accentColor: string) {
    const next = { ...settings, accentColor }
    setSettingsState(next)
    await setSettings(next)
  }

  async function handleToggleOverlay() {
    setToggleError(null)
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) return

    try {
      await chrome.tabs.sendMessage(tab.id, { type: "toggle-copilot" })
      return
    } catch {
      // Most common cause: this tab was already open before the extension was installed
      // or reloaded, so the content script never got auto-injected into it. Inject it
      // now (activeTab grants us permission for this tab since we're mid user-gesture)
      // and retry once before giving up.
    }

    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] })
      await chrome.tabs.sendMessage(tab.id, { type: "toggle-copilot" })
    } catch {
      setToggleError("Couldn't load on this page — try refreshing the tab, then click this again.")
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    setContext((c) => ({ ...c, offer: c.offer ? `${c.offer}\n\n${text}` : text }))
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  if (!loaded) {
    return <div className="p-4 text-sm text-neutral-500">Loading…</div>
  }

  return (
    <div className="flex flex-col gap-4 bg-neutral-50 p-4">
      <div className="flex items-center gap-2">
        <img src="/salsey-icon.png" alt="" className="size-7" />
        <div>
          <h1 className="text-base font-semibold text-neutral-900">Salsey</h1>
          <p className="text-xs text-neutral-500">
            Give it your offer, script, and objection playbook so it can speak in your voice, not generic advice.
          </p>
        </div>
      </div>

      <button
        onClick={handleToggleOverlay}
        className="rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
      >
        Show / hide copilot on this page
      </button>
      {toggleError && <p className="text-xs text-red-600">{toggleError}</p>}

      <AccountSection />

      <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-3">
        <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Overlay color (so it's visible on any background)
        </label>
        <div className="flex items-center gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => handleColorChange(color)}
              title={color}
              className={`size-6 rounded-full border ${
                settings.accentColor === color ? "border-neutral-900 ring-2 ring-neutral-300" : "border-neutral-200"
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
          <input
            type="color"
            value={settings.accentColor}
            onChange={(e) => handleColorChange(e.target.value)}
            className="size-6 cursor-pointer rounded-full border border-neutral-200 bg-transparent p-0"
            title="Custom color"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {FIELDS.map((field) => (
          <div key={field.key} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">{field.label}</label>
              {field.allowUpload && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  Upload .txt
                </button>
              )}
            </div>
            <textarea
              value={context[field.key]}
              onChange={(e) => setContext((c) => ({ ...c, [field.key]: e.target.value }))}
              placeholder={field.placeholder}
              rows={4}
              className="w-full resize-none rounded-lg border border-neutral-200 bg-white p-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
            />
          </div>
        ))}
      </div>

      <input ref={fileInputRef} type="file" accept=".txt,.md" onChange={handleFileUpload} className="hidden" />

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          Save
        </button>
        {savedAt && <span className="text-xs text-neutral-500">Saved</span>}
      </div>

      <p className="text-[11px] leading-relaxed text-neutral-400">
        Powered by the hosted copilot backend — no local server needed. Sign in above to save call transcripts
        automatically when you stop listening.
      </p>
    </div>
  )
}
