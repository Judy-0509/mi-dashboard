import { useEffect, useState } from "react"
import { Download, FileSpreadsheet } from "lucide-react"

import { AniProductionChart } from "@/components/ani-production-chart"
import { CumulativeProductionChart } from "@/components/cumulative-production-chart"
import { DashboardShell } from "@/components/dashboard-shell"
import { ExecutiveSummary } from "@/components/executive-summary"
import { PortalSidebar, type PortalPage } from "@/components/portal-sidebar"
import { SellThroughAnalysis } from "@/components/sell-through-analysis"
import { buttonVariants } from "@/components/ui/button"
import { WeeklyAnalysis } from "@/components/weekly-analysis"
import { WeeklyExecutiveSummary } from "@/components/weekly-executive-summary"
import { dashboardMeta } from "@/data/production"
import { weeklyDescription, weeklyTitle } from "@/data/weekly"

declare global {
  interface Window {
    __MI_WEEKLY_EXPORT__?: boolean
  }
}

const isWeeklyExport = window.__MI_WEEKLY_EXPORT__ === true

function pageFromHash(): PortalPage {
  return isWeeklyExport || window.location.hash === "#weekly"
    ? "weekly"
    : window.location.hash === "#sell-through"
      ? "sell-through"
    : window.location.hash === "#ani"
      ? "ani"
      : "sigma"
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
        {!isWeeklyExport && (
          <div className="flex items-center gap-2">
            <a
              aria-disabled="true"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "text-sm leading-5 font-normal",
              })}
              title="사내 EDM 원본 엑셀 링크가 아직 설정되지 않았습니다."
            >
              <FileSpreadsheet aria-hidden="true" />
              원본 엑셀 보기
            </a>
            <a
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "text-sm leading-5 font-normal",
              })}
              download="MI_Weekly_2026W32.html"
              href="./MI_Weekly_2026W32.html"
            >
              <Download aria-hidden="true" />
              Download as HTML
            </a>
          </div>
        )}
      </header>
      <WeeklyExecutiveSummary />
      <WeeklyAnalysis />
    </>
  )
}

function AniPage() {
  return (
    <>
      <header
        className="flex items-end justify-between border-b pb-4"
        id="ani"
      >
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
            ANI / iPhone Model Production
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            iPhone 모델 생산 전망
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            2024 Q1–2027 Q2 분기별 Forecast · 단위: Mu
          </p>
        </div>
      </header>
      <AniProductionChart />
    </>
  )
}

function SellThroughPage() {
  return (
    <>
      <header
        className="flex items-end justify-between border-b pb-4"
        id="sell-through"
      >
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
            Counterpoint / Sell-in · Sell-through
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            스마트폰 Sell-in / Sell-through
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            2025년 9월–2026년 8월 월별 흐름 · Inventory / WoS 비교
          </p>
        </div>
      </header>
      <SellThroughAnalysis />
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
    const hash =
      page === "weekly"
        ? "#weekly"
        : page === "sell-through"
          ? "#sell-through"
          : page === "ani"
            ? "#ani"
            : "#overview"
    setActivePage(page)
    if (window.location.hash !== hash) {
      window.location.hash = hash
    }
  }

  return (
    <DashboardShell
      scrollable={
        activePage === "weekly" ||
        activePage === "ani" ||
        activePage === "sell-through"
      }
      sidebar={
        isWeeklyExport ? null : (
          <PortalSidebar activePage={activePage} onNavigate={navigate} />
        )
      }
    >
      {activePage === "weekly" ? (
        <WeeklyPage />
      ) : activePage === "sell-through" ? (
        <SellThroughPage />
      ) : activePage === "ani" ? (
        <AniPage />
      ) : (
        <SigmaPage />
      )}
    </DashboardShell>
  )
}

export default App
