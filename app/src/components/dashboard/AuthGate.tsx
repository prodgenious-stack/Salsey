"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/hooks/useUser"

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [loading, user, router])

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-[#918B76]">Loading…</div>
  }

  return <>{children}</>
}
