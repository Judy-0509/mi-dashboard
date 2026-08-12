import type * as React from "react"

import { LatestResultsSelectionButton } from "@/components/latest-results-selection-button"
import {
  getAffiliateAnnualRowCell,
  type AffiliateAnnualDataset,
  type AffiliateForecastSelection,
  type AffiliateKey,
} from "@/data/affiliate-annual-results"
import { getResultCellState } from "@/data/latest-results"

export type AffiliateAnnualResultsTableProps = {
  affiliate: AffiliateKey
  dataset: AffiliateAnnualDataset
  onAffiliateChange: (affiliate: AffiliateKey) => void
  onForecastSelect: (selection: AffiliateForecastSelection) => void
}

function formatValue(value: number | null) {
  return value === null ? "—" : value.toFixed(1)
}

export function AffiliateAnnualResultsTable({
  affiliate,
  dataset,
  onAffiliateChange,
  onForecastSelect,
}: AffiliateAnnualResultsTableProps): React.ReactElement {
  return (
    <section aria-labelledby="affiliate-annual-results-title" className="min-w-0">
      <div className="mb-3 border-b pb-3">
        <div aria-label="관계사 선택" className="flex flex-wrap items-center gap-1.5" role="group">
          <span className="type-control-label me-1 text-muted-foreground">관계사</span>
          {dataset.affiliates.map((item) => (
            <LatestResultsSelectionButton
              key={item}
              onClick={() => onAffiliateChange(item)}
              pressed={affiliate === item}
            >
              {item}
            </LatestResultsSelectionButton>
          ))}
        </div>
      </div>

      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="type-section-title" id="affiliate-annual-results-title">
          {affiliate} · 연도 비교
        </h2>
        <p className="type-control text-muted-foreground">단위: Mu</p>
      </div>

      <div className="overflow-hidden border">
        <table className="type-table-body w-full table-fixed border-collapse tabular-nums">
          <caption className="sr-only">
            {affiliate} 업체별 2024–2027 연간 실적
          </caption>
          <colgroup>
            <col className="w-[112px]" />
            {dataset.years.map((year) => <col key={year} />)}
          </colgroup>
          <thead className="type-table-header bg-muted/40 text-muted-foreground">
            <tr>
              <th className="border px-2 py-2 text-left" scope="col">Vendor</th>
              {dataset.years.map((year) => (
                <th className="border px-1 py-2 text-center" key={year} scope="col">
                  '{year.slice(2)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {dataset.rows.map((row) => (
              <tr key={row.key}>
                <th className="border px-2 py-2 text-left" scope="row">
                  {row.label}
                </th>
                {dataset.years.map((year) => {
                  const cell = getAffiliateAnnualRowCell(affiliate, year, row)
                  const state = getResultCellState(cell)
                  return (
                    <td className="border px-1 py-2 text-right" key={year}>
                      {state === "actual" ? (
                        <span>{formatValue(cell.actual)}</span>
                      ) : state === "missing" ? (
                        <span aria-label="Actual 및 Forecast 없음">—</span>
                      ) : row.rowKey === null ? (
                        <span>{formatValue(cell.forecast)} (F)</span>
                      ) : (
                        <button
                          aria-label={`${affiliate} ${row.label} ${year} Forecast ${formatValue(cell.forecast)}`}
                          className="inline-flex min-h-8 w-full items-center justify-end rounded-sm px-2 text-primary hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                          onClick={() =>
                            onForecastSelect({
                              affiliate,
                              rowKey: row.rowKey!,
                              year,
                            })
                          }
                          type="button"
                        >
                          {formatValue(cell.forecast)} (F)
                        </button>
                      )}
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
