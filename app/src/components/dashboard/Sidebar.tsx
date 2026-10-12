"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ChevronDown, LogOut } from "lucide-react"
import { useUser } from "@/hooks/useUser"
import { useDashboardData } from "@/components/dashboard/DashboardDataProvider"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import {
  FreehandNavReporting,
  FreehandNavFern,
  FreehandNavWidget,
  FreehandNavHelpCenter,
  FreehandBottomBookDemo,
  FreehandTemplateOnboardTeammates,
  FreehandNavIntegrations,
  FreehandNavSettings,
} from "@/components/icons"
import type { IconComponent } from "@/components/icons/types"

interface NavItem {
  href: string
  label: string
  icon: IconComponent
  badge?: "live" | number
}

function initialsFromEmail(email: string) {
  const name = email.split("@")[0]
  const parts = name.split(/[._-]/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function NavGroup({ heading, items, pathname }: { heading: string; items: NavItem[]; pathname: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="px-2 pb-1.5 text-[11px] font-semibold tracking-[0.04em] text-[#918B76] uppercase">
        {heading}
      </div>
      {items.map((item) => {
        const selected = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "flex h-[33px] items-center gap-2.5 rounded-lg px-2 text-[13px]",
              selected
                ? "border border-[rgba(34,54,58,0.10)] bg-white font-medium text-[#22363A] shadow-[0_1px_2px_rgba(34,54,58,0.08)]"
                : "border border-transparent text-[#4A5A5E] hover:bg-[rgba(34,54,58,0.05)]",
            ].join(" ")}
          >
            <Icon size={17} className="flex-none opacity-75" />
            <span>{item.label}</span>
            {item.badge === "live" && (
              <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-[#7A8F52]">
                <span className="size-1.5 rounded-full bg-[#A8B846]" />
                ON
              </span>
            )}
            {typeof item.badge === "number" && item.badge > 0 && (
              <span className="ml-auto text-[11px] text-[#918B76]">{item.badge}</span>
            )}
          </Link>
        )
      })}
    </div>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()
  const { transcripts } = useDashboardData()

  const WORKSPACE: NavItem[] = [
    { href: "/dashboard", label: "Overview", icon: FreehandNavReporting },
    { href: "/dashboard/live", label: "Live copilot", icon: FreehandNavFern, badge: "live" },
  ]
  const INSIGHTS: NavItem[] = [
    { href: "/dashboard/calls", label: "Calls", icon: FreehandNavWidget, badge: transcripts.length },
    { href: "/dashboard/objections", label: "Objections", icon: FreehandNavHelpCenter },
    { href: "/dashboard/playbook", label: "Playbook", icon: FreehandBottomBookDemo },
    { href: "/dashboard/reps", label: "Reps", icon: FreehandTemplateOnboardTeammates },
  ]
  const WORKSPACE_SETUP: NavItem[] = [
    { href: "/dashboard/extension", label: "Extension", icon: FreehandNavIntegrations },
    { href: "/dashboard/settings", label: "Settings", icon: FreehandNavSettings },
  ]

  async function handleSignOut() {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <aside className="flex w-[236px] flex-none flex-col border-r border-[rgba(34,54,58,0.09)] pt-5 pb-4">
      <div className="px-4">
        <Link href="/" className="flex h-9 w-full items-center gap-[9px] rounded-lg px-2 text-left hover:bg-[rgba(34,54,58,0.05)]">
          <Image src="/salsey-icon.png" alt="" width={22} height={22} className="flex-none" />
          <span className="text-sm font-semibold tracking-[-0.01em] text-[#22363A]">Salsey</span>
          <ChevronDown className="ml-auto size-[13px] flex-none text-[#918B76]" strokeWidth={2.2} />
        </Link>
      </div>

      <div className="mt-[22px] flex flex-1 flex-col gap-[22px] overflow-y-auto px-4">
        <NavGroup heading="Workspace" items={WORKSPACE} pathname={pathname} />
        <NavGroup heading="Insights" items={INSIGHTS} pathname={pathname} />
        <NavGroup heading="Workspace setup" items={WORKSPACE_SETUP} pathname={pathname} />
      </div>

      <div className="mt-3 border-t border-[rgba(34,54,58,0.08)] px-4 pt-3.5">
        <div className="flex items-center gap-[9px]">
          <span className="flex size-[26px] flex-none items-center justify-center rounded-full bg-[#918B76] text-[11px] font-semibold text-white">
            {user?.email ? initialsFromEmail(user.email) : "—"}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12.5px] font-medium text-[#22363A]">{user?.email ?? "…"}</div>
            <div className="text-[11px] text-[#918B76]">Account exec</div>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="flex size-6 flex-none items-center justify-center rounded-md text-[#918B76] hover:bg-[rgba(34,54,58,0.06)] hover:text-[#22363A]"
          >
            <LogOut size={14} />
          </button>
        </div>
        <a
          href="https://streamlinehq.com"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block text-[10px] text-[#918B76] hover:text-[#22363A]"
        >
          Icons by Streamline
        </a>
      </div>
    </aside>
  )
}
