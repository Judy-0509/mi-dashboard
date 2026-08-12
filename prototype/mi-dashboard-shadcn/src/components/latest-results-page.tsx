import type * as React from "react"
import { useState } from "react"

import { AffiliateAnnualResultsTable } from "@/components/affiliate-annual-results-table"
import {
  ForecastHistoryChart,
  type ForecastHistoryDisplay,
} from "@/components/forecast-history-chart"
import { LatestResultsSelectionButton } from "@/components/latest-results-selection-button"
import { LatestResultsTable } from "@/components/latest-results-table"
import { PageActions } from "@/components/page-actions"
import {
  defaultAffiliate,
  getAffiliateForecastHistory,
  type AffiliateAnnualDataset,
  type AffiliateForecastSelection,
  type AffiliateKey,
} from "@/data/affiliate-annual-results"
import {
  getDatasetFirstForecast,
  getDatasetForecastHistory,
  type Agency,
  type ForecastSelection,
  type LatestResultsDataset,
  type LatestResultsView,
  type Quarter,
} from "@/data/latest-results"
import type { PortalPage } from "@/components/portal-sidebar"

export type LatestResultsPageProps<RowKey extends string> = {
  dataset: LatestResultsDataset<RowKey>
  page: PortalPage
  eyebrow: string
  title: string
  subtitle: string
  affiliateDataset?: AffiliateAnnualDataset
}

function getDatasetHistoryDisplay<RowKey extends string>(
  dataset: LatestResultsDataset<RowKey>,
  selection: ForecastSelection<RowKey> | null,
): ForecastHistoryDisplay | null {
  if (!selection) return null
  const agency = dataset.agencies.find((item) => item.key === selection.agency)
  const row = dataset.rows.find((item) => item.rowKey === selection.rowKey)
  return {
    history: getDatasetForecastHistory(dataset, selection),
    title: `Forecast History · ${agency?.label ?? selection.agency} · ${row?.label ?? selection.rowKey} · ${selection.quarter}`,
  }
}

export function LatestResultsPage<RowKey extends string>({
  affiliateDataset,
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
  const [selectedAffiliate, setSelectedAffiliate] =
    useState<AffiliateKey>(defaultAffiliate)
  const [historyDisplay, setHistoryDisplay] = useState<ForecastHistoryDisplay | null>(() =>
    affiliateDataset
      ? null
      : getDatasetHistoryDisplay(
          dataset,
          getDatasetFirstForecast(dataset, "quarter", firstQuarter, firstAgency),
        ),
  )

  const resetDatasetHistory = (
    nextView: LatestResultsView,
    nextQuarter: Quarter,
    nextAgency: Agency,
  ) => {
    setHistoryDisplay(
      affiliateDataset
        ? null
        : getDatasetHistoryDisplay(
            dataset,
            getDatasetFirstForecast(dataset, nextView, nextQuarter, nextAgency),
          ),
    )
  }

  const changeView = (nextView: LatestResultsView) => {
    setView(nextView)
    resetDatasetHistory(nextView, selectedQuarter, selectedAgency)
  }

  const changeQuarter = (nextQuarter: Quarter) => {
    setSelectedQuarter(nextQuarter)
    resetDatasetHistory(view, nextQuarter, selectedAgency)
  }

  const changeAgency = (nextAgency: Agency) => {
    setSelectedAgency(nextAgency)
    resetDatasetHistory(view, selectedQuarter, nextAgency)
  }

  const selectDatasetForecast = (selection: ForecastSelection<RowKey>) => {
    setHistoryDisplay(getDatasetHistoryDisplay(dataset, selection))
  }

  const selectAffiliateForecast = (selection: AffiliateForecastSelection) => {
    const row = affiliateDataset?.rows.find(
      (item) => item.rowKey === selection.rowKey,
    )
    setHistoryDisplay({
      history: getAffiliateForecastHistory(selection),
      title: `Forecast History · ${selection.affiliate} · ${row?.label ?? selection.rowKey} · '${selection.year.slice(2)}`,
    })
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
          <LatestResultsSelectionButton onClick={() => changeView("quarter")} pressed={view === "quarter"}>
            Quarter
          </LatestResultsSelectionButton>
          <LatestResultsSelectionButton onClick={() => changeView("agency")} pressed={view === "agency"}>
            Agency
          </LatestResultsSelectionButton>
        </div>
        <div aria-label="Latest Results selection" className="flex flex-wrap items-center gap-1.5" role="group">
          <span className="type-control-label me-1 text-muted-foreground">
            {view === "quarter" ? "Quarter" : "Agency"}
          </span>
          {view === "quarter"
            ? dataset.quarters.map((quarter) => (
                <LatestResultsSelectionButton
                  key={quarter}
                  onClick={() => changeQuarter(quarter)}
                  pressed={selectedQuarter === quarter}
                >
                  {quarter}
                </LatestResultsSelectionButton>
              ))
            : dataset.agencies.map((agency) => (
                <LatestResultsSelectionButton
                  key={agency.key}
                  onClick={() => changeAgency(agency.key)}
                  pressed={selectedAgency === agency.key}
                >
                  {agency.label}
                </LatestResultsSelectionButton>
              ))}
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-[minmax(0,58fr)_minmax(0,42fr)] items-start gap-4">
        <section className="min-w-0 overflow-hidden rounded-lg border bg-card px-5 py-4">
          <LatestResultsTable
            agency={selectedAgency}
            dataset={dataset}
            onForecastSelect={selectDatasetForecast}
            quarter={selectedQuarter}
            view={view}
          />
        </section>
        {affiliateDataset ? (
          <section className="min-w-0 overflow-hidden rounded-lg border bg-card px-5 py-4">
            <AffiliateAnnualResultsTable
              affiliate={selectedAffiliate}
              dataset={affiliateDataset}
              onAffiliateChange={(nextAffiliate) => {
                setSelectedAffiliate(nextAffiliate)
                setHistoryDisplay(null)
              }}
              onForecastSelect={selectAffiliateForecast}
            />
          </section>
        ) : (
          <ForecastHistoryChart display={historyDisplay} />
        )}
      </div>
      {affiliateDataset ? (
        <div className="mt-4">
          <ForecastHistoryChart display={historyDisplay} />
        </div>
      ) : null}
    </>
  )
}
