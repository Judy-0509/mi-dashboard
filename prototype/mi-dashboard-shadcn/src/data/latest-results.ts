import {
  canonicalVendors,
  type CanonicalVendorKey,
} from "./vendor-catalog.ts"

export type Quarter = "2026 Q1" | "2026 Q2" | "2026 Q3" | "2026 Q4"

export type Agency =
  | "omdia"
  | "counterpoint"
  | "gfk"
  | "techinsights"
  | "tsr"
  | "trendforce"

export type ForecastSnapshot = {
  monthLabel: string
  value: number
}

export type ResultCell = {
  actual: number | null
  forecast: number | null
  history: ForecastSnapshot[]
}

export type LatestResultsAgency<RowKey extends string = CanonicalVendorKey> = {
  key: Agency
  label: string
  sourceUrl: string | null
  cells: Record<Quarter, Record<RowKey, ResultCell>>
}

export type LatestResultsView = "quarter" | "agency"

export type ForecastSelection<RowKey extends string = CanonicalVendorKey> = {
  agency: Agency
  rowKey: RowKey
  quarter: Quarter
}

export type LatestResultsTableRow<RowKey extends string = CanonicalVendorKey> = {
  key: string
  label: string
  rowKey: RowKey | null
  color?: string
}

export type LatestResultsDataset<RowKey extends string> = {
  quarters: readonly Quarter[]
  agencies: readonly LatestResultsAgency<RowKey>[]
  rows: readonly LatestResultsTableRow<RowKey>[]
  rowKeys: readonly RowKey[]
  rowHeaderLabel: string
  rowHeaderWidthClass: string
  getRowCell: (
    agency: Agency,
    quarter: Quarter,
    row: LatestResultsTableRow<RowKey>,
  ) => ResultCell
}

export const latestResultsQuarters: readonly Quarter[] = [
  "2026 Q1",
  "2026 Q2",
  "2026 Q3",
  "2026 Q4",
]

export const latestResultsVendors = canonicalVendors

const latestResultsCnTotalVendorKeys: readonly CanonicalVendorKey[] = [
  "xiaomi",
  "huawei",
  "honor",
  "oppo",
  "vivo",
  "transsion",
  "lenovo",
]

export const latestResultsTableRows: readonly LatestResultsTableRow[] = [
  {
    key: "total",
    label: "Total",
    rowKey: null,
  },
  { key: "mx", label: "MX", rowKey: "samsung" },
  { key: "apple", label: "Apple", rowKey: "apple" },
  {
    key: "cn-total",
    label: "CN Total",
    rowKey: null,
  },
  ...latestResultsVendors
    .filter(({ key }) => key !== "apple" && key !== "samsung")
    .map(({ key, label }) => ({
      key,
      label,
      rowKey: key,
    })),
]

export const latestResultsAgencyKeys: readonly Agency[] = [
  "omdia",
  "counterpoint",
  "gfk",
  "techinsights",
  "tsr",
  "trendforce",
]

export const latestResultsAgencyMetadata: Readonly<
  Record<Agency, { label: string; sourceUrl: string | null }>
> = {
  omdia: {
    label: "Omdia",
    sourceUrl: "https://omdia.tech.informa.com/",
  },
  counterpoint: {
    label: "Counterpoint",
    sourceUrl: "https://www.counterpointresearch.com/",
  },
  gfk: { label: "GfK", sourceUrl: null },
  techinsights: {
    label: "TechInsights",
    sourceUrl: "https://www.techinsights.com/",
  },
  tsr: { label: "TSR", sourceUrl: null },
  trendforce: {
    label: "TrendForce",
    sourceUrl: "https://www.trendforce.com/",
  },
}

function makeHistory(baseValue: number): ForecastSnapshot[] {
  return [
    { monthLabel: "2025-12", value: Number((baseValue - 0.8).toFixed(1)) },
    { monthLabel: "2026-01", value: Number((baseValue - 0.4).toFixed(1)) },
    { monthLabel: "2026-02", value: baseValue },
  ]
}

function makeResultCell(
  agencyIndex: number,
  quarterIndex: number,
  vendorIndex: number,
  vendor: CanonicalVendorKey,
): ResultCell {
  if (agencyIndex === 0 && quarterIndex === 0 && vendor === "apple") {
    return { actual: 12.4, forecast: 12.8, history: [] }
  }

  if (agencyIndex === 0 && quarterIndex === 0 && vendor === "samsung") {
    return { actual: null, forecast: 11.1, history: makeHistory(11.1) }
  }

  if (agencyIndex === 0 && quarterIndex === 0 && vendor === "xiaomi") {
    return { actual: 0, forecast: null, history: [] }
  }

  if (agencyIndex > 0 && quarterIndex === 0 && vendor === "apple") {
    return { actual: null, forecast: null, history: [] }
  }

  const pattern = (agencyIndex + quarterIndex + vendorIndex) % 5
  const baseValue = Number(
    (8 + agencyIndex * 1.4 + quarterIndex * 0.8 + vendorIndex * 0.6).toFixed(1),
  )

  if (pattern === 0) {
    return { actual: baseValue, forecast: null, history: [] }
  }

  if (pattern === 1 || pattern === 2) {
    return {
      actual: null,
      forecast: baseValue,
      history: makeHistory(baseValue),
    }
  }

  return { actual: null, forecast: null, history: [] }
}

function makeAgencyCells(
  agencyIndex: number,
): Record<Quarter, Record<CanonicalVendorKey, ResultCell>> {
  return Object.fromEntries(
    latestResultsQuarters.map((quarter, quarterIndex) => [
      quarter,
      Object.fromEntries(
        latestResultsVendors.map(({ key }, vendorIndex) => [
          key,
          makeResultCell(agencyIndex, quarterIndex, vendorIndex, key),
        ]),
      ),
    ]),
  ) as Record<Quarter, Record<CanonicalVendorKey, ResultCell>>
}

export const latestResultsAgencies: readonly LatestResultsAgency[] =
  latestResultsAgencyKeys.map((key, agencyIndex) => ({
    key,
    ...latestResultsAgencyMetadata[key],
    cells: makeAgencyCells(agencyIndex),
  }))

export function getResultCellState(
  cell: ResultCell,
): "actual" | "forecast" | "missing" {
  if (cell.actual !== null) return "actual"
  if (cell.forecast !== null) return "forecast"
  return "missing"
}

export function getLatestResultsRowCell(
  agency: Agency,
  quarter: Quarter,
  row: LatestResultsTableRow,
): ResultCell {
  const agencyData = getAgency(agency)
  if (!agencyData) return { actual: null, forecast: null, history: [] }
  return getVendorResultsRowCell(agencyData.cells[quarter], row)
}

export function getVendorResultsRowCell(
  cells: Record<CanonicalVendorKey, ResultCell>,
  row: LatestResultsTableRow,
): ResultCell {
  if (row.rowKey !== null) return cells[row.rowKey]

  const vendorKeys =
    row.key === "cn-total"
      ? latestResultsCnTotalVendorKeys
      : latestResultsVendors.map(({ key }) => key)

  let total = 0
  let hasValue = false
  let hasForecast = false
  for (const vendor of vendorKeys) {
    const cell = cells[vendor]
    const state = getResultCellState(cell)
    if (state === "actual") {
      total += cell.actual ?? 0
      hasValue = true
    } else if (state === "forecast") {
      total += cell.forecast ?? 0
      hasValue = true
      hasForecast = true
    }
  }

  if (!hasValue) return { actual: null, forecast: null, history: [] }
  const value = Number(total.toFixed(1))
  return hasForecast
    ? { actual: null, forecast: value, history: [] }
    : { actual: value, forecast: null, history: [] }
}

function getAgency(key: Agency) {
  return latestResultsAgencies.find((agency) => agency.key === key)
}

export function getFirstForecast(
  view: LatestResultsView,
  selectedQuarter: Quarter,
  selectedAgency: Agency,
): ForecastSelection | null {
  return getDatasetFirstForecast(
    latestResultsDataset,
    view,
    selectedQuarter,
    selectedAgency,
  )
}

export function getForecastHistory(
  selection: ForecastSelection | null,
): ForecastSnapshot[] {
  return getDatasetForecastHistory(latestResultsDataset, selection)
}

export function getDatasetFirstForecast<RowKey extends string>(
  dataset: LatestResultsDataset<RowKey>,
  view: LatestResultsView,
  selectedQuarter: Quarter,
  selectedAgency: Agency,
): ForecastSelection<RowKey> | null {
  if (view === "quarter") {
    for (const rowKey of dataset.rowKeys) {
      for (const agency of dataset.agencies) {
        const cell = agency.cells[selectedQuarter][rowKey]
        if (getResultCellState(cell) === "forecast") {
          return { agency: agency.key, rowKey, quarter: selectedQuarter }
        }
      }
    }
    return null
  }

  const agency = dataset.agencies.find((item) => item.key === selectedAgency)
  if (!agency) return null
  for (const rowKey of dataset.rowKeys) {
    for (const quarter of dataset.quarters) {
      const cell = agency.cells[quarter][rowKey]
      if (getResultCellState(cell) === "forecast") {
        return { agency: agency.key, rowKey, quarter }
      }
    }
  }
  return null
}

export function getDatasetForecastHistory<RowKey extends string>(
  dataset: LatestResultsDataset<RowKey>,
  selection: ForecastSelection<RowKey> | null,
): ForecastSnapshot[] {
  if (!selection) return []
  const agency = dataset.agencies.find((item) => item.key === selection.agency)
  const cell = agency?.cells[selection.quarter][selection.rowKey]
  if (!cell || getResultCellState(cell) !== "forecast") return []
  return cell.history.map((snapshot) => ({ ...snapshot }))
}

export function isValidSourceUrl(url: string | null | undefined): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      parsed.hostname.length > 0
    )
  } catch {
    return false
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function assertRecordKeys(
  value: unknown,
  expected: readonly string[],
  label: string,
): asserts value is Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(`Incomplete ${label} dimensions`)
  }

  const actualKeys = Object.keys(value)
  if (
    actualKeys.length !== expected.length ||
    actualKeys.some((key, index) => key !== expected[index])
  ) {
    throw new Error(`Incomplete ${label} dimensions`)
  }
}

function assertFiniteOrNull(value: unknown, label: string): void {
  if (value !== null && (typeof value !== "number" || !Number.isFinite(value))) {
    throw new Error(`${label} must be finite or null`)
  }
}

export function validateLatestResultsDataset<RowKey extends string>(
  dataset: LatestResultsDataset<RowKey>,
): void {
  const { agencies, quarters, rowKeys } = dataset
  if (agencies.length !== latestResultsAgencyKeys.length) {
    throw new Error("Incomplete agency dimensions")
  }

  agencies.forEach((agency, agencyIndex) => {
    if (agency.key !== latestResultsAgencyKeys[agencyIndex]) {
      throw new Error("Agency dimensions are out of order")
    }
    if (!agency.label.trim()) throw new Error("Agency label is required")
    if (agency.sourceUrl !== null && !isValidSourceUrl(agency.sourceUrl)) {
      throw new Error(`Invalid source URL for ${agency.key}`)
    }
    assertRecordKeys(agency.cells, quarters, `${agency.key} quarter`)

    for (const quarter of quarters) {
      const quarterCells = agency.cells[quarter]
      assertRecordKeys(
        quarterCells,
        rowKeys,
        `${agency.key} ${quarter} row`,
      )

      for (const rowKey of rowKeys) {
        const cell = quarterCells[rowKey]
        if (!isRecord(cell) || !Array.isArray(cell.history)) {
          throw new Error(`Invalid result cell for ${agency.key} ${quarter} ${rowKey}`)
        }
        assertFiniteOrNull(cell.actual, `${agency.key} ${quarter} ${rowKey} actual`)
        assertFiniteOrNull(
          cell.forecast,
          `${agency.key} ${quarter} ${rowKey} forecast`,
        )
        for (const snapshot of cell.history) {
          if (!isRecord(snapshot) || typeof snapshot.monthLabel !== "string") {
            throw new Error(`Invalid snapshot label for ${agency.key} ${quarter} ${rowKey}`)
          }
          if (!snapshot.monthLabel.trim() || !Number.isFinite(snapshot.value)) {
            throw new Error(`Snapshot values must be finite for ${agency.key} ${quarter} ${rowKey}`)
          }
        }
        if (cell.actual === null && cell.forecast === null && cell.history.length > 0) {
          throw new Error(`History requires a Forecast for ${agency.key} ${quarter} ${rowKey}`)
        }
      }
    }
  })
}

export const latestResultsDataset: LatestResultsDataset<CanonicalVendorKey> = {
  quarters: latestResultsQuarters,
  agencies: latestResultsAgencies,
  rows: latestResultsTableRows,
  rowKeys: latestResultsVendors.map(({ key }) => key),
  rowHeaderLabel: "Vendor",
  rowHeaderWidthClass: "w-[112px]",
  getRowCell: getLatestResultsRowCell,
}

export function validateLatestResultsData(
  agencies: readonly LatestResultsAgency[],
): void {
  validateLatestResultsDataset({ ...latestResultsDataset, agencies })
}

validateLatestResultsDataset(latestResultsDataset)
