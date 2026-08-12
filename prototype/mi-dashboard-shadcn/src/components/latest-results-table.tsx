import type * as React from "react"

import {
  getResultCellState,
  isValidSourceUrl,
  latestResultsAgencies,
  latestResultsQuarters,
  latestResultsVendors,
  type Agency,
  type ForecastSelection,
  type LatestResultsView,
  type Quarter,
} from "@/data/latest-results"
import type { CanonicalVendorKey } from "@/data/vendor-catalog"

export type LatestResultsTableProps = {
  view: LatestResultsView
  quarter: Quarter
  agency: Agency
  onForecastSelect: (selection: ForecastSelection) => void
}

function formatValue(value: number | null): string {
  return value === null ? "—" : value.toFixed(1)
}

function getAgency(key: Agency) {
  return latestResultsAgencies.find((item) => item.key === key) ?? latestResultsAgencies[0]
}

function getResultCell(
  agency: Agency,
  quarter: Quarter,
  vendor: CanonicalVendorKey,
) {
  return getAgency(agency).cells[quarter][vendor]
}

function SourceLink({ agency }: { agency: (typeof latestResultsAgencies)[number] }) {
  if (!isValidSourceUrl(agency.sourceUrl)) {
    return (
      <span
        aria-disabled="true"
        aria-label={`${agency.label} 원본 자료 없음`}
        className="text-muted-foreground"
        title="원본 자료 없음"
      >
        —
      </span>
    )
  }

  return (
    <a
      aria-label={`${agency.label} 원본 자료 보기`}
      className="ms-1 text-muted-foreground underline-offset-2 hover:underline focus-visible:underline"
      href={agency.sourceUrl ?? undefined}
      rel="noopener noreferrer"
      target="_blank"
      title="원본 자료 보기"
    >
      ↗
    </a>
  )
}

function ResultValue({
  agency,
  quarter,
  vendor,
  onForecastSelect,
}: {
  agency: Agency
  quarter: Quarter
  vendor: (typeof latestResultsVendors)[number]
  onForecastSelect: (selection: ForecastSelection) => void
}) {
  const cell = getResultCell(agency, quarter, vendor.key)
  const state = getResultCellState(cell)

  if (state === "actual") {
    return <span className="tabular-nums">{formatValue(cell.actual)}</span>
  }

  if (state === "missing") {
    return <span aria-label="Actual 및 Forecast 없음">—</span>
  }

  return (
    <button
      aria-label={`${getAgency(agency).label} ${vendor.label} ${quarter} Forecast ${formatValue(cell.forecast)}`}
      className="rounded-sm px-1 tabular-nums underline decoration-dotted underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      onClick={() =>
        onForecastSelect({ agency, quarter, vendor: vendor.key })
      }
      type="button"
    >
      {formatValue(cell.forecast)} (F)
    </button>
  )
}

export function LatestResultsTable({
  agency,
  onForecastSelect,
  quarter,
  view,
}: LatestResultsTableProps): React.ReactElement {
  const selectedAgency = getAgency(agency)
  const columns =
    view === "quarter"
      ? latestResultsAgencies.map((item) => ({
          key: item.key,
          label: item.label,
          source: item,
        }))
      : latestResultsQuarters.map((item) => ({
          key: item,
          label: item,
          source: null,
        }))

  return (
    <section aria-labelledby="latest-results-table-title" className="min-w-0">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="type-section-title" id="latest-results-table-title">
          {view === "quarter" ? (
            `${quarter} · 조사기관 비교`
          ) : (
            <>
              {selectedAgency.label} · 분기 비교
              <SourceLink agency={selectedAgency} />
            </>
          )}
        </h2>
        <p className="type-control text-muted-foreground">단위: Mu</p>
      </div>
      <div className="overflow-hidden border">
        <table className="type-table-body w-full table-fixed border-collapse tabular-nums">
          <caption className="sr-only">
            {view === "quarter"
              ? `${quarter} 조사기관별 최신 실적`
              : `${selectedAgency.label} 분기별 최신 실적`}
          </caption>
          <colgroup>
            <col className="w-[112px]" />
            {columns.map((column) => (
              <col key={column.key} />
            ))}
          </colgroup>
          <thead className="type-table-header bg-muted/40 text-muted-foreground">
            <tr>
              <th className="border px-2 py-2 text-left" scope="col">
                Vendor
              </th>
              {columns.map((column) => (
                <th className="border px-1 py-2 text-center" key={column.key} scope="col">
                  <span>{column.label}</span>
                  {column.source ? <SourceLink agency={column.source} /> : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {latestResultsVendors.map((vendor) => (
              <tr key={vendor.key}>
                <th className="border px-2 py-2 text-left" scope="row">
                  {vendor.label}
                </th>
                {columns.map((column) => {
                  const cellAgency = view === "quarter" ? column.key as Agency : agency
                  const cellQuarter = view === "quarter" ? quarter : column.key as Quarter
                  return (
                    <td className="border px-1 py-2 text-right" key={column.key}>
                      <ResultValue
                        agency={cellAgency}
                        onForecastSelect={onForecastSelect}
                        quarter={cellQuarter}
                        vendor={vendor}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
