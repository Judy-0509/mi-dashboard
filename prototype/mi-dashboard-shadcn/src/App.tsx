import { useEffect, useState } from "react"
import { Download, FileSpreadsheet } from "lucide-react"

import { AniProductionChart } from "@/components/ani-production-chart"
import { CumulativeProductionChart } from "@/components/cumulative-production-chart"
import { DashboardShell } from "@/components/dashboard-shell"
import { ExecutiveSummary } from "@/components/executive-summary"
import { FlagshipSalesChart } from "@/components/flagship-sales-chart"
import { MiInsightWeeklyReport } from "@/components/mi-insight-weekly-report"
import { MiWeeklySellThroughSummary } from "@/components/mi-weekly-sell-through-summary"
import { PortalSidebar, type PortalPage } from "@/components/portal-sidebar"
import { SellThroughAnalysis } from "@/components/sell-through-analysis"
import { buttonVariants } from "@/components/ui/button"
import pageConfig from "@/data/page-config.json"
import { WeeklyAnalysis } from "@/components/weekly-analysis"
import { WeeklyExecutiveSummary } from "@/components/weekly-executive-summary"
import { dashboardMeta } from "@/data/production"
import { weeklyDescription, weeklyTitle } from "@/data/weekly"

declare global {
  interface Window {
    __MI_EXPORT_PAGE__?: PortalPage
  }
}

type PageConfig = {
  hash: string
  exportFileName: string
  originalExcelUrl: string | null
}

const PAGE_CONFIG = pageConfig as Record<PortalPage, PageConfig>
const exportPage = window.__MI_EXPORT_PAGE__
const isExport = exportPage !== undefined

function pageFromHash(): PortalPage {
  if (exportPage) {
    return exportPage
  }

  return (
    (Object.entries(PAGE_CONFIG).find(([, config]) => config.hash === window.location.hash)?.[0] as
      | PortalPage
      | undefined) ?? "sigma"
  )
}

function PageActions({ page }: { page: PortalPage }) {
  if (isExport) {
    return null
  }

  const config = PAGE_CONFIG[page]
  const excelDisabled = config.originalExcelUrl === null

  return (
    <div className="flex items-center gap-2">
      <a
        aria-disabled={excelDisabled}
        className={buttonVariants({
          variant: "outline",
          size: "sm",
          className: "text-sm leading-5 font-normal",
        })}
        href={config.originalExcelUrl ?? undefined}
        onClick={excelDisabled ? (event) => event.preventDefault() : undefined}
        tabIndex={excelDisabled ? -1 : undefined}
        title={
          excelDisabled
            ? "사내 원본 엑셀 링크가 아직 설정되지 않았습니다."
            : undefined
        }
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
        download={config.exportFileName}
        href={`./${config.exportFileName}`}
      >
        <Download aria-hidden="true" />
        Download as HTML
      </a>
    </div>
  )
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
        <div className="flex items-center gap-4">
          <p className="font-mono text-xs text-muted-foreground">
            기준: {dashboardMeta.asOf.replaceAll("-", ".")}
          </p>
          <PageActions page="sigma" />
        </div>
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
        <PageActions page="weekly" />
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
        <PageActions page="ani" />
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
        <PageActions page="sell-through" />
      </header>
      <SellThroughAnalysis />
    </>
  )
}

function FlagshipSalesPage() {
  return (
    <>
      <header
        className="flex items-end justify-between border-b pb-4"
        id="flagship-sales"
      >
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
            Counterpoint / Flagship Sales
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Flagship Sales
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            2024년 9월–2026년 8월 24개월 모델 판매량 · 출시월 기준 Lifecycle 비교
          </p>
        </div>
        <PageActions page="flagship-sales" />
      </header>
      <FlagshipSalesChart />
    </>
  )
}

function MiInsightPage() {
  return (
    <>
      <header
        className="flex items-end justify-between border-b pb-4"
        id="mi-insight"
      >
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
            MI Insight / Weekly Report
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Weekly Report
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            EDM 업데이트 자료와 공유 내용
          </p>
        </div>
        <PageActions page="mi-insight" />
      </header>
      <MiInsightWeeklyReport />
    </>
  )
}

function MiInsightWeeklySellThroughPage() {
  return (
    <>
      <header
        className="flex items-end justify-between border-b pb-4"
        id="mi-weekly-sell-through"
      >
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
            MI Insight / Weekly Sell-through
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Weekly Sell-through
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Counterpoint Weekly 데이터 기반 Sell-out 현황과 Trend
          </p>
        </div>
        <PageActions page="mi-weekly-sell-through" />
      </header>
      <MiWeeklySellThroughSummary />
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
    const hash = PAGE_CONFIG[page].hash
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
        activePage === "sell-through" ||
        activePage === "flagship-sales" ||
        activePage === "mi-weekly-sell-through"
      }
      sidebar={
        isExport ? null : (
          <PortalSidebar activePage={activePage} onNavigate={navigate} />
        )
      }
    >
      {activePage === "weekly" ? (
        <WeeklyPage />
      ) : activePage === "sell-through" ? (
        <SellThroughPage />
      ) : activePage === "flagship-sales" ? (
        <FlagshipSalesPage />
      ) : activePage === "ani" ? (
        <AniPage />
      ) : activePage === "mi-insight" ? (
        <MiInsightPage />
      ) : activePage === "mi-weekly-sell-through" ? (
        <MiInsightWeeklySellThroughPage />
      ) : (
        <SigmaPage />
      )}
    </DashboardShell>
  )
}

export default App
