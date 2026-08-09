import { CumulativeProductionChart } from "@/components/cumulative-production-chart"
import { DashboardShell } from "@/components/dashboard-shell"
import { ExecutiveSummary } from "@/components/executive-summary"
import { PortalSidebar } from "@/components/portal-sidebar"

export function App() {
  return (
    <DashboardShell sidebar={<PortalSidebar />}>
      <header className="flex items-end justify-between border-b pb-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            SigmaIntel / Production Forecast
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            스마트폰 생산 전망
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            2024 Q1–2027 Q2 분기 누적 Forecast
          </p>
        </div>
        <p className="font-mono text-xs text-muted-foreground">기준: 2026.08.10</p>
      </header>
      <ExecutiveSummary />
      <CumulativeProductionChart />
    </DashboardShell>
  )
}

export default App
