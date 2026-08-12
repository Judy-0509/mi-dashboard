import type * as React from "react"
import { useEffect, useState } from "react"

import { AniProductionChart } from "@/components/ani-production-chart"
import { CumulativeProductionChart } from "@/components/cumulative-production-chart"
import { DashboardShell } from "@/components/dashboard-shell"
import { ExecutiveSummary } from "@/components/executive-summary"
import { FlagshipSalesChart } from "@/components/flagship-sales-chart"
import { LatestResultsPage } from "@/components/latest-results-page"
import { MiInsightWeeklyReport } from "@/components/mi-insight-weekly-report"
import { MiWeeklySellThroughSummary } from "@/components/mi-weekly-sell-through-summary"
import {
  isExport,
  PAGE_CONFIG,
  PageActions,
  pageFromHash,
} from "@/components/page-actions"
import { PipelineCheck } from "@/components/pipeline-check"
import { PipelineCheckIPhone } from "@/components/pipeline-check-iphone"
import { PortalSidebar, type PortalPage } from "@/components/portal-sidebar"
import { SellThroughAnalysis } from "@/components/sell-through-analysis"
import { WeeklyAnalysis } from "@/components/weekly-analysis"
import { WeeklyExecutiveSummary } from "@/components/weekly-executive-summary"
import { dashboardMeta } from "@/data/production"
import { latestResultsDataset } from "@/data/latest-results"
import { latestResultsIPhoneDataset } from "@/data/latest-results-iphone"
import { weeklyDescription, weeklyTitle } from "@/data/weekly"

function SigmaPage() {
  return (
    <>
      <header className="flex items-end justify-between border-b pb-4">
        <div>
          <p className="type-eyebrow text-muted-foreground">
            SigmaIntel / Production Forecast
          </p>
          <h1 className="type-page-title mt-1 tracking-tight">
            스마트폰 생산 전망
          </h1>
          <p className="type-page-subtitle mt-1 text-muted-foreground">
            {dashboardMeta.firstQuarter}–{dashboardMeta.lastQuarter} 분기 누적
            Forecast
          </p>
        </div>
        <div className="flex items-center gap-4">
          <p className="type-control tabular-nums text-muted-foreground">
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
          <p className="type-eyebrow text-muted-foreground">
            Counterpoint / Weekly
          </p>
          <h1 className="type-page-title mt-1 tracking-tight">
            {weeklyTitle}
          </h1>
          <p className="type-page-subtitle mt-1 text-muted-foreground">
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
          <p className="type-eyebrow text-muted-foreground">
            ANI / iPhone Model Production
          </p>
          <h1 className="type-page-title mt-1 tracking-tight">
            iPhone 모델 생산 전망
          </h1>
          <p className="type-page-subtitle mt-1 text-muted-foreground">
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
          <p className="type-eyebrow text-muted-foreground">
            Counterpoint / Sell-in · Sell-through
          </p>
          <h1 className="type-page-title mt-1 tracking-tight">
            스마트폰 Sell-in / Sell-through
          </h1>
          <p className="type-page-subtitle mt-1 text-muted-foreground">
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
          <p className="type-eyebrow text-muted-foreground">
            Counterpoint / Flagship Sales
          </p>
          <h1 className="type-page-title mt-1 tracking-tight">
            Flagship Sales
          </h1>
          <p className="type-page-subtitle mt-1 text-muted-foreground">
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
          <p className="type-eyebrow text-muted-foreground">
            MI Insight / Weekly Report
          </p>
          <h1 className="type-page-title mt-1 tracking-tight">
            Weekly Report
          </h1>
          <p className="type-page-subtitle mt-1 text-muted-foreground">
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
          <p className="type-eyebrow text-muted-foreground">
            MI Insight / Weekly Sell-through
          </p>
          <h1 className="type-page-title mt-1 tracking-tight">
            Weekly Sell-through
          </h1>
          <p className="type-page-subtitle mt-1 text-muted-foreground">
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

function PipelineCheckPage(): React.ReactElement {
  return (
    <>
      <header
        className="flex items-end justify-between border-b pb-4"
        id="pipeline-check"
      >
        <div>
          <p className="type-eyebrow text-muted-foreground">
            MI TAM / PIPELINE CHECK
          </p>
          <h1 className="type-page-title mt-1 tracking-tight">
            분기별 Pipeline Check
          </h1>
          <p className="type-page-subtitle mt-1 text-muted-foreground">
            2025 Q1–2026 Q2 Production · Inventory · Sell-in · Sell-out
          </p>
        </div>
        <PageActions page="pipeline-check" />
      </header>
      <PipelineCheck />
    </>
  )
}

function PipelineCheckIPhonePage(): React.ReactElement {
  return (
    <>
      <header
        className="flex items-end justify-between border-b pb-4"
        id="pipeline-check-iphone"
      >
        <div>
          <p className="type-eyebrow text-muted-foreground">
            MI TAM / PIPELINE CHECK · IPHONE
          </p>
          <h1 className="type-page-title mt-1 tracking-tight">
            분기별 Pipeline Check (iPhone)
          </h1>
          <p className="type-page-subtitle mt-1 text-muted-foreground">
            2025 Q1–2026 Q2 iPhone Production · Inventory · Sell-in · Sell-out
          </p>
        </div>
        <PageActions page="pipeline-check-iphone" />
      </header>
      <PipelineCheckIPhone />
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
        activePage === "latest-results" ||
        activePage === "latest-results-iphone" ||
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
      ) : activePage === "pipeline-check" ? (
        <PipelineCheckPage />
      ) : activePage === "pipeline-check-iphone" ? (
        <PipelineCheckIPhonePage />
      ) : activePage === "latest-results" ? (
        <LatestResultsPage
          dataset={latestResultsDataset}
          eyebrow="MI TAM / LATEST RESULTS"
          page="latest-results"
          subtitle="2026 Q1–Q4 Actual · Forecast"
          title="조사기관별 최신 실적"
        />
      ) : activePage === "latest-results-iphone" ? (
        <LatestResultsPage
          dataset={latestResultsIPhoneDataset}
          eyebrow="MI TAM / LATEST RESULTS · IPHONE"
          page="latest-results-iphone"
          subtitle="2026 Q1–Q4 Actual · Forecast · iPhone models"
          title="조사기관별 최신 실적 (iPhone)"
        />
      ) : (
        <SigmaPage />
      )}
    </DashboardShell>
  )
}

export default App
