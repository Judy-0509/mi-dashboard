import type * as React from "react"
import { useState } from "react"

import { ForecastHistoryChart } from "@/components/forecast-history-chart"
import { LatestResultsTable } from "@/components/latest-results-table"
import { PageActions } from "@/components/page-actions"
import {
  getFirstForecast,
  latestResultsAgencies,
  latestResultsQuarters,
  type Agency,
  type ForecastSelection,
  type LatestResultsView,
  type Quarter,
} from "@/data/latest-results"

const firstQuarter: Quarter = latestResultsQuarters[0]
const firstAgency: Agency = latestResultsAgencies[0].key

function SelectionButton({
  children,
  onClick,
  pressed,
}: {
  children: React.ReactNode
  onClick: () => void
  pressed: boolean
}) {
  return (
    <button
      aria-pressed={pressed}
      className={`type-control rounded-md border px-2.5 py-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
        pressed
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background hover:bg-muted"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}

export function LatestResultsPage(): React.ReactElement {
  const [view, setView] = useState<LatestResultsView>("quarter")
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter>(firstQuarter)
  const [selectedAgency, setSelectedAgency] = useState<Agency>(firstAgency)
  const [selection, setSelection] = useState<ForecastSelection | null>(() =>
    getFirstForecast("quarter", firstQuarter, firstAgency),
  )

  const changeView = (nextView: LatestResultsView) => {
    setView(nextView)
    setSelection(getFirstForecast(nextView, selectedQuarter, selectedAgency))
  }

  const changeQuarter = (nextQuarter: Quarter) => {
    setSelectedQuarter(nextQuarter)
    setSelection(getFirstForecast(view, nextQuarter, selectedAgency))
  }

  const changeAgency = (nextAgency: Agency) => {
    setSelectedAgency(nextAgency)
    setSelection(getFirstForecast(view, selectedQuarter, nextAgency))
  }

  return (
    <>
      <header className="flex items-end justify-between border-b pb-4">
        <div>
          <p className="type-eyebrow text-muted-foreground">MI TAM / LATEST RESULTS</p>
          <h1 className="type-page-title mt-1 tracking-tight">조사기관별 최신 실적</h1>
          <p className="type-page-subtitle mt-1 text-muted-foreground">
            2026 Q1–Q4 Actual · Forecast
          </p>
        </div>
        <PageActions page="latest-results" />
      </header>

      <div className="my-4 flex flex-wrap items-center gap-3 border-b pb-3">
        <div aria-label="Latest Results view" className="flex items-center gap-1.5" role="group">
          <span className="type-control-label me-1 text-muted-foreground">View</span>
          <SelectionButton onClick={() => changeView("quarter")} pressed={view === "quarter"}>
            Quarter
          </SelectionButton>
          <SelectionButton onClick={() => changeView("agency")} pressed={view === "agency"}>
            Agency
          </SelectionButton>
        </div>
        <div aria-label="Latest Results selection" className="flex flex-wrap items-center gap-1.5" role="group">
          <span className="type-control-label me-1 text-muted-foreground">
            {view === "quarter" ? "Quarter" : "Agency"}
          </span>
          {view === "quarter"
            ? latestResultsQuarters.map((quarter) => (
                <SelectionButton
                  key={quarter}
                  onClick={() => changeQuarter(quarter)}
                  pressed={selectedQuarter === quarter}
                >
                  {quarter}
                </SelectionButton>
              ))
            : latestResultsAgencies.map((agency) => (
                <SelectionButton
                  key={agency.key}
                  onClick={() => changeAgency(agency.key)}
                  pressed={selectedAgency === agency.key}
                >
                  {agency.label}
                </SelectionButton>
              ))}
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-[minmax(0,58fr)_minmax(0,42fr)] items-start gap-4">
        <section className="min-w-0 overflow-hidden rounded-lg border bg-card px-5 py-4">
          <LatestResultsTable
            agency={selectedAgency}
            onForecastSelect={setSelection}
            quarter={selectedQuarter}
            view={view}
          />
        </section>
        <ForecastHistoryChart selection={selection} />
      </div>
    </>
  )
}
