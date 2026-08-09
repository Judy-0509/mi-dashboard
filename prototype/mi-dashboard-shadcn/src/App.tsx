import { useEffect, useState } from "react"

import { CumulativeProductionChart } from "@/components/cumulative-production-chart"
import { DashboardShell } from "@/components/dashboard-shell"
import { ExecutiveSummary } from "@/components/executive-summary"
import { PortalSidebar, type PortalPage } from "@/components/portal-sidebar"
import { WeeklyAnalysis } from "@/components/weekly-analysis"
import { WeeklyExecutiveSummary } from "@/components/weekly-executive-summary"
import { dashboardMeta } from "@/data/production"
import { weeklyDescription, weeklyTitle } from "@/data/weekly"

function pageFromHash(): PortalPage {
  return window.location.hash === "#weekly" ? "weekly" : "sigma"
}

function SigmaPage() {
  return (
    <>
      <header className="flex items-end justify-between border-b pb-4">
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
            SigmaIntel / Production Forecast
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            스마트폰 생산 전망
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {dashboardMeta.firstQuarter}–{dashboardMeta.lastQuarter} 분기 누적
            Forecast
          </p>
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          기준: {dashboardMeta.asOf.replaceAll("-", ".")}
        </p>
      </header>
      <ExecutiveSummary />
      <CumulativeProductionChart />
    </>
  )
}

function WeeklyPage() {
  return (
    <>
      <header
        className="flex items-end justify-between border-b pb-4"
        id="weekly"
      >
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
            Counterpoint / Weekly
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {weeklyTitle}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {weeklyDescription}
          </p>
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          2026 W32 · 5 Regions · MU
        </p>
      </header>
      <WeeklyExecutiveSummary />
      <WeeklyAnalysis />
    </>
  )
}

export function App() {
  const [activePage, setActivePage] = useState<PortalPage>(pageFromHash)

  useEffect(() => {
    const updatePage = () => setActivePage(pageFromHash())
    window.addEventListener("hashchange", updatePage)
    return () => window.removeEventListener("hashchange", updatePage)
  }, [])

  const navigate = (page: PortalPage) => {
    const hash = page === "weekly" ? "#weekly" : "#overview"
    setActivePage(page)
    if (window.location.hash !== hash) {
      window.location.hash = hash
    }
  }

  return (
    <DashboardShell
      scrollable={activePage === "weekly"}
      sidebar={<PortalSidebar activePage={activePage} onNavigate={navigate} />}
    >
      {activePage === "weekly" ? <WeeklyPage /> : <SigmaPage />}
    </DashboardShell>
  )
}

export default App
