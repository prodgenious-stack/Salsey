import Sidebar from "@/components/dashboard/Sidebar"
import AuthGate from "@/components/dashboard/AuthGate"
import { DashboardDataProvider } from "@/components/dashboard/DashboardDataProvider"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <DashboardDataProvider>
        <div className="flex min-h-screen w-full bg-[#F7F7F5]">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col border-l border-[rgba(34,54,58,0.06)] bg-white">
            <div className="min-w-0 flex-1 overflow-y-auto px-8 pt-[30px] pb-16">
              <div className="mx-auto max-w-[1120px]">{children}</div>
            </div>
          </div>
        </div>
      </DashboardDataProvider>
    </AuthGate>
  )
}
