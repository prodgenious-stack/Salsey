import CallCopilotOverlay from "@/components/call-copilot/CallCopilotOverlay"

export default function CallCopilotDemoPage() {
  return (
    <main className="relative flex h-screen w-full items-start justify-center overflow-hidden bg-neutral-900 pt-10">
      {/* stand-in for a live video call background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#3a3a3a,transparent_60%),radial-gradient(circle_at_70%_70%,#2a2a2a,transparent_55%)]" />
      <div className="absolute inset-0 bg-neutral-950/40" />

      <CallCopilotOverlay />
    </main>
  )
}
