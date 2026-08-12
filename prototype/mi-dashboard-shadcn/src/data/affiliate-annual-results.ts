import {
  getResultCellState,
  getVendorResultsRowCell,
  latestResultsTableRows,
  latestResultsVendors,
  type ForecastSnapshot,
  type LatestResultsTableRow,
  type ResultCell,
} from "./latest-results.ts"
import type { CanonicalVendorKey } from "./vendor-catalog.ts"

export type AffiliateKey = "LSI" | "A" | "B" | "D" | "E" | "F" | "M"
export type AffiliateYear = "2024" | "2025" | "2026" | "2027"

export type AffiliateForecastSelection = {
  affiliate: AffiliateKey
  rowKey: CanonicalVendorKey
  year: AffiliateYear
}

export type AffiliateAnnualDataset = {
  affiliates: readonly AffiliateKey[]
  years: readonly AffiliateYear[]
  rows: readonly LatestResultsTableRow[]
  cells: Record<
    AffiliateKey,
    Record<AffiliateYear, Record<CanonicalVendorKey, ResultCell>>
  >
}

export const affiliateKeys: readonly AffiliateKey[] = [
  "LSI",
  "A",
  "B",
  "D",
  "E",
  "F",
  "M",
]

export const affiliateYears: readonly AffiliateYear[] = [
  "2024",
  "2025",
  "2026",
  "2027",
]

export const defaultAffiliate: AffiliateKey = "LSI"

function makeHistory(year: AffiliateYear, baseValue: number): ForecastSnapshot[] {
  return [
    { monthLabel: `${year}-01`, value: Number((baseValue - 1.2).toFixed(1)) },
    { monthLabel: `${year}-04`, value: Number((baseValue - 0.7).toFixed(1)) },
    { monthLabel: `${year}-07`, value: Number((baseValue - 0.3).toFixed(1)) },
    { monthLabel: `${year}-10`, value: baseValue },
  ]
}

function makeCell(
  affiliateIndex: number,
  year: AffiliateYear,
  yearIndex: number,
  vendor: CanonicalVendorKey,
  vendorIndex: number,
): ResultCell {
  const baseValue = Number(
    (31 + affiliateIndex * 2.1 + yearIndex * 3.4 + vendorIndex * 1.3).toFixed(1),
  )

  if (affiliateIndex === 0 && year === "2026" && vendor === "apple") {
    return { actual: 72.4, forecast: 73.1, history: makeHistory(year, 73.1) }
  }
  if (affiliateIndex === 0 && year === "2026" && vendor === "samsung") {
    return { actual: null, forecast: 68.6, history: makeHistory(year, 68.6) }
  }
  if (affiliateIndex === 0 && year === "2024" && vendor === "xiaomi") {
    return { actual: 0, forecast: null, history: [] }
  }

  const pattern = (affiliateIndex + yearIndex + vendorIndex) % 6
  if (pattern === 5) return { actual: null, forecast: null, history: [] }
  if (yearIndex < 2 || (yearIndex === 2 && pattern < 3)) {
    return { actual: baseValue, forecast: null, history: [] }
  }
  return {
    actual: null,
    forecast: baseValue,
    history: makeHistory(year, baseValue),
  }
}

const cells = Object.fromEntries(
  affiliateKeys.map((affiliate, affiliateIndex) => [
    affiliate,
    Object.fromEntries(
      affiliateYears.map((year, yearIndex) => [
        year,
        Object.fromEntries(
          latestResultsVendors.map(({ key }, vendorIndex) => [
            key,
            makeCell(affiliateIndex, year, yearIndex, key, vendorIndex),
          ]),
        ),
      ]),
    ),
  ]),
) as AffiliateAnnualDataset["cells"]

export const affiliateAnnualResultsDataset: AffiliateAnnualDataset = {
  affiliates: affiliateKeys,
  years: affiliateYears,
  rows: latestResultsTableRows,
  cells,
}

export function getAffiliateAnnualRowCell(
  affiliate: AffiliateKey,
  year: AffiliateYear,
  row: LatestResultsTableRow,
): ResultCell {
  return getVendorResultsRowCell(cells[affiliate][year], row)
}

export function getAffiliateForecastHistory(
  selection: AffiliateForecastSelection,
): ForecastSnapshot[] {
  const cell = cells[selection.affiliate][selection.year][selection.rowKey]
  return getResultCellState(cell) === "forecast"
    ? cell.history.map((snapshot) => ({ ...snapshot }))
    : []
}

export function validateAffiliateAnnualDataset(
  dataset: AffiliateAnnualDataset,
): void {
  if (dataset.affiliates.join() !== affiliateKeys.join()) {
    throw new Error("Affiliate dimensions are incomplete")
  }
  if (dataset.years.join() !== affiliateYears.join()) {
    throw new Error("Affiliate year dimensions are incomplete")
  }

  const vendorKeys = latestResultsVendors.map(({ key }) => key)
  for (const affiliate of dataset.affiliates) {
    if (Object.keys(dataset.cells[affiliate]).join() !== dataset.years.join()) {
      throw new Error(`Incomplete year dimensions for ${affiliate}`)
    }
    for (const year of dataset.years) {
      const annualCells = dataset.cells[affiliate][year]
      if (Object.keys(annualCells).join() !== vendorKeys.join()) {
        throw new Error(`Incomplete vendor dimensions for ${affiliate} ${year}`)
      }
      for (const vendor of vendorKeys) {
        const cell = annualCells[vendor]
        for (const value of [cell.actual, cell.forecast]) {
          if (value !== null && !Number.isFinite(value)) {
            throw new Error(`Non-finite value for ${affiliate} ${year} ${vendor}`)
          }
        }
        if (cell.history.some(({ monthLabel, value }) => !monthLabel || !Number.isFinite(value))) {
          throw new Error(`Invalid history for ${affiliate} ${year} ${vendor}`)
        }
        if (cell.forecast === null && cell.history.length > 0) {
          throw new Error(`History requires Forecast for ${affiliate} ${year} ${vendor}`)
        }
      }
    }
  }
}

validateAffiliateAnnualDataset(affiliateAnnualResultsDataset)
