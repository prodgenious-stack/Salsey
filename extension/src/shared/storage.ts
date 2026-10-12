import { DEFAULT_SETTINGS, EMPTY_SALES_CONTEXT, type AuthSession, type CopilotSettings, type SalesContext } from "./types"

const STORAGE_KEY = "salesContext"
const SETTINGS_KEY = "copilotSettings"
const POSITION_KEY = "overlayPosition"
const AUTH_KEY = "authSession"
const MIC_BASELINE_KEY = "micBaseline"

export async function getSalesContext(): Promise<SalesContext> {
  const result = await chrome.storage.local.get(STORAGE_KEY)
  return { ...EMPTY_SALES_CONTEXT, ...(result[STORAGE_KEY] as Partial<SalesContext> | undefined) }
}

export async function setSalesContext(context: SalesContext): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: context })
}

export async function getSettings(): Promise<CopilotSettings> {
  const result = await chrome.storage.local.get(SETTINGS_KEY)
  return { ...DEFAULT_SETTINGS, ...(result[SETTINGS_KEY] as Partial<CopilotSettings> | undefined) }
}

export async function setSettings(settings: CopilotSettings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings })
}

export interface OverlayPosition {
  top: number
  left: number
}

export async function getOverlayPosition(): Promise<OverlayPosition | null> {
  const result = await chrome.storage.local.get(POSITION_KEY)
  return (result[POSITION_KEY] as OverlayPosition | undefined) ?? null
}

export async function setOverlayPosition(position: OverlayPosition): Promise<void> {
  await chrome.storage.local.set({ [POSITION_KEY]: position })
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const result = await chrome.storage.local.get(AUTH_KEY)
  return (result[AUTH_KEY] as AuthSession | undefined) ?? null
}

export async function setAuthSession(session: AuthSession | null): Promise<void> {
  if (session) {
    await chrome.storage.local.set({ [AUTH_KEY]: session })
  } else {
    await chrome.storage.local.remove(AUTH_KEY)
  }
}

// Calibrated once per install (or re-run any time) — a rough loudness baseline for
// this rep's own voice on their own mic, used to guess which transcript segments are
// them vs. the prospect. Not per-account: it's a physical mic/room characteristic.
export async function getMicBaseline(): Promise<number | null> {
  const result = await chrome.storage.local.get(MIC_BASELINE_KEY)
  return (result[MIC_BASELINE_KEY] as number | undefined) ?? null
}

export async function setMicBaseline(level: number | null): Promise<void> {
  if (level === null) {
    await chrome.storage.local.remove(MIC_BASELINE_KEY)
  } else {
    await chrome.storage.local.set({ [MIC_BASELINE_KEY]: level })
  }
}
