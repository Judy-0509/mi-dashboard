import type * as React from "react"

import {
  getResultCellState,
  isValidSourceUrl,
  type Agency,
  type ForecastSelection,
  type LatestResultsDataset,
  type LatestResultsTableRow,
  type LatestResultsView,
  type Quarter,
} from "@/data/latest-results"

export type LatestResultsTableProps<RowKey extends string> = {
  dataset: LatestResultsDataset<RowKey>
  view: LatestResultsView
  quarter: Quarter
  agency: Agency
  onForecastSelect: (selection: ForecastSelection<RowKey>) => void
}

function formatValue(value: number | null): string {
  return value === null ? "—" : value.toFixed(1)
}

function getAgency<RowKey extends string>(dataset: LatestResultsDataset<RowKey>, key: Agency) {
  return dataset.agencies.find((item) => item.key === key) ?? dataset.agencies[0]
}

function SourceLink({ agency }: { agency: { label: string; sourceUrl: string | null } }) {
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

function ResultValue<RowKey extends string>({
  agency,
  dataset,
  quarter,
  row,
  onForecastSelect,
}: {
  agency: Agency
  dataset: LatestResultsDataset<RowKey>
  quarter: Quarter
  row: LatestResultsTableRow<RowKey>
  onForecastSelect: (selection: ForecastSelection<RowKey>) => void
}) {
  const cell = dataset.getRowCell(agency, quarter, row)
  const state = getResultCellState(cell)
  const rowKey = row.rowKey

  if (state === "actual") {
    return <span className="tabular-nums">{formatValue(cell.actual)}</span>
  }

  if (state === "missing") {
    return <span aria-label="Actual 및 Forecast 없음">—</span>
  }

  if (rowKey === null) {
    return <span className="tabular-nums">{formatValue(cell.forecast)} (F)</span>
  }

  return (
    <button
      aria-label={`${getAgency(dataset, agency).label} ${row.label} ${quarter} Forecast ${formatValue(cell.forecast)}`}
      className="inline-flex min-h-8 w-full items-center justify-end rounded-sm px-2 tabular-nums text-primary hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      onClick={() =>
        onForecastSelect({ agency, quarter, rowKey })
      }
      type="button"
    >
      {formatValue(cell.forecast)} (F)
    </button>
  )
}

export function LatestResultsTable<RowKey extends string>({
  agency,
  dataset,
  onForecastSelect,
  quarter,
  view,
}: LatestResultsTableProps<RowKey>): React.ReactElement {
  const selectedAgency = getAgency(dataset, agency)
  const columns =
    view === "quarter"
      ? dataset.agencies.map((item) => ({
          key: item.key,
          label: item.label,
          source: item,
        }))
      : dataset.quarters.map((item) => ({
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
            <col className={dataset.rowHeaderWidthClass} />
            {columns.map((column) => (
              <col key={column.key} />
            ))}
          </colgroup>
          <thead className="type-table-header bg-muted/40 text-muted-foreground">
            <tr>
              <th className="border px-2 py-2 text-left" scope="col">
                {dataset.rowHeaderLabel}
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
            {dataset.rows.map((row) => (
              <tr key={row.key}>
                <th className="border px-2 py-2 text-left" scope="row">
                  <span className="inline-flex items-center gap-1.5">
                    {row.color ? (
                      <span
                        aria-hidden="true"
                        className="size-2.5 shrink-0"
                        style={{ backgroundColor: row.color }}
                      />
                    ) : null}
                    {row.label}
                  </span>
                </th>
                {columns.map((column) => {
                  const cellAgency = view === "quarter" ? column.key as Agency : agency
                  const cellQuarter = view === "quarter" ? quarter : column.key as Quarter
                  return (
                    <td className="border px-1 py-2 text-right" key={column.key}>
                      <ResultValue
                        agency={cellAgency}
                        dataset={dataset}
                        onForecastSelect={onForecastSelect}
                        quarter={cellQuarter}
                        row={row}
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
