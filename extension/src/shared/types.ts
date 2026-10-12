export interface SalesContext {
  offer: string
  script: string
  objections: string
}

export const EMPTY_SALES_CONTEXT: SalesContext = { offer: "", script: "", objections: "" }

export interface CopilotRequest {
  action: string
  question?: string
  transcript?: string
  recentSegment?: string
}

// Port protocol between the content script and the background service worker.
// The background owns the actual fetch to the Next.js backend and forwards the
// streamed text back over the same long-lived port, chunk by chunk.
export type CopilotPortMessage =
  | { type: "chunk"; text: string }
  | { type: "done" }
  | { type: "error"; message: string }

export const COPILOT_PORT_NAME = "copilot-stream"
export const API_BASE_URL = "https://salsey.vercel.app"

// Safe to embed — this is the publishable anon key, meant for client-side use and
// already public in the web app's bundle. It only grants what the database's row-level
// security policies allow (each user can only ever touch their own rows).
export const SUPABASE_URL = "https://gnxhkbhlypozaisvezbg.supabase.co"
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdueGhrYmhseXBvemFpc3ZlemJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMzE5MzIsImV4cCI6MjEwMzYwNzkzMn0.KK5uO7ExliUTBJn4ToFXFOiWMsZxdJwIjycEd1MmmhA"

export interface AuthSession {
  accessToken: string
  refreshToken: string
  expiresAt: number // epoch seconds
  email: string
}

export interface CopilotSettings {
  accentColor: string
}

export const DEFAULT_SETTINGS: CopilotSettings = { accentColor: "#3b82f6" }

// Must match the sentinel the backend's AUTO_LISTEN prompt uses for "nothing worth saying."
export const NOOP = "__NOOP__"
