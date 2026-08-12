import type * as React from "react"
import { useState } from "react"

import { ForecastHistoryChart } from "@/components/forecast-history-chart"
import { LatestResultsTable } from "@/components/latest-results-table"
import { PageActions } from "@/components/page-actions"
import {
  getDatasetFirstForecast,
  type Agency,
  type ForecastSelection,
  type LatestResultsDataset,
  type LatestResultsView,
  type Quarter,
} from "@/data/latest-results"
import type { PortalPage } from "@/components/portal-sidebar"

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

export type LatestResultsPageProps<RowKey extends string> = {
  dataset: LatestResultsDataset<RowKey>
  page: PortalPage
  eyebrow: string
  title: string
  subtitle: string
}

export function LatestResultsPage<RowKey extends string>({
  dataset,
  eyebrow,
  page,
  subtitle,
  title,
}: LatestResultsPageProps<RowKey>): React.ReactElement {
  const firstQuarter: Quarter = dataset.quarters[0]
  const firstAgency: Agency = dataset.agencies[0].key
  const [view, setView] = useState<LatestResultsView>("quarter")
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter>(firstQuarter)
  const [selectedAgency, setSelectedAgency] = useState<Agency>(firstAgency)
  const [selection, setSelection] = useState<ForecastSelection<RowKey> | null>(() =>
    getDatasetFirstForecast(dataset, "quarter", firstQuarter, firstAgency),
  )

  const changeView = (nextView: LatestResultsView) => {
    setView(nextView)
    setSelection(getDatasetFirstForecast(dataset, nextView, selectedQuarter, selectedAgency))
  }

  const changeQuarter = (nextQuarter: Quarter) => {
    setSelectedQuarter(nextQuarter)
    setSelection(getDatasetFirstForecast(dataset, view, nextQuarter, selectedAgency))
  }

  const changeAgency = (nextAgency: Agency) => {
    setSelectedAgency(nextAgency)
    setSelection(getDatasetFirstForecast(dataset, view, selectedQuarter, nextAgency))
  }

  return (
    <>
      <header className="flex items-end justify-between border-b pb-4">
        <div>
          <p className="type-eyebrow text-muted-foreground">{eyebrow}</p>
          <h1 className="type-page-title mt-1 tracking-tight">{title}</h1>
          <p className="type-page-subtitle mt-1 text-muted-foreground">
            {subtitle}
          </p>
        </div>
        <PageActions page={page} />
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
            ? dataset.quarters.map((quarter) => (
                <SelectionButton
                  key={quarter}
                  onClick={() => changeQuarter(quarter)}
                  pressed={selectedQuarter === quarter}
                >
                  {quarter}
                </SelectionButton>
              ))
            : dataset.agencies.map((agency) => (
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
            dataset={dataset}
            onForecastSelect={setSelection}
            quarter={selectedQuarter}
            view={view}
          />
        </section>
        <ForecastHistoryChart dataset={dataset} selection={selection} />
      </div>
    </>
  )
}
