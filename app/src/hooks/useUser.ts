"use client"

import { useAuthContext } from "@/components/AuthProvider"

export function useUser() {
  const { session, loading } = useAuthContext()
  return { session, user: session?.user ?? null, loading }
}
