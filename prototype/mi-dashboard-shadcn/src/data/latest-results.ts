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

export type LatestResultsAgency = {
  key: Agency
  label: string
  sourceUrl: string | null
  cells: Record<Quarter, Record<CanonicalVendorKey, ResultCell>>
}

export type LatestResultsView = "quarter" | "agency"

export type ForecastSelection = {
  agency: Agency
  vendor: CanonicalVendorKey
  quarter: Quarter
}

export type LatestResultsTableRow = {
  key: string
  label: string
  vendor: CanonicalVendorKey | null
  vendorKeys: readonly CanonicalVendorKey[]
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
    vendor: null,
    vendorKeys: latestResultsVendors.map(({ key }) => key),
  },
  { key: "mx", label: "MX", vendor: "samsung", vendorKeys: ["samsung"] },
  { key: "apple", label: "Apple", vendor: "apple", vendorKeys: ["apple"] },
  {
    key: "cn-total",
    label: "CN Total",
    vendor: null,
    vendorKeys: latestResultsCnTotalVendorKeys,
  },
  ...latestResultsVendors
    .filter(({ key }) => key !== "apple" && key !== "samsung")
    .map(({ key, label }) => ({
      key,
      label,
      vendor: key,
      vendorKeys: [key],
    })),
]

const latestResultsAgencyKeys: readonly Agency[] = [
  "omdia",
  "counterpoint",
  "gfk",
  "techinsights",
  "tsr",
  "trendforce",
]

const latestResultsAgencyMetadata: Readonly<
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
  if (row.vendor !== null) return agencyData.cells[quarter][row.vendor]

  let total = 0
  let hasValue = false
  let hasForecast = false
  for (const vendor of row.vendorKeys) {
    const cell = agencyData.cells[quarter][vendor]
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
  if (view === "quarter") {
    for (const vendor of latestResultsVendors) {
      for (const agency of latestResultsAgencies) {
        const cell = agency.cells[selectedQuarter][vendor.key]
        if (getResultCellState(cell) === "forecast") {
          return {
            agency: agency.key,
            vendor: vendor.key,
            quarter: selectedQuarter,
          }
        }
      }
    }
    return null
  }

  const agency = getAgency(selectedAgency)
  if (!agency) return null

  for (const vendor of latestResultsVendors) {
    for (const quarter of latestResultsQuarters) {
      const cell = agency.cells[quarter][vendor.key]
      if (getResultCellState(cell) === "forecast") {
        return { agency: agency.key, vendor: vendor.key, quarter }
      }
    }
  }
  return null
}

export function getForecastHistory(
  selection: ForecastSelection | null,
): ForecastSnapshot[] {
  if (!selection) return []
  const agency = getAgency(selection.agency)
  const cell = agency?.cells[selection.quarter][selection.vendor]
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

export function validateLatestResultsData(
  agencies: readonly LatestResultsAgency[],
): void {
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
    assertRecordKeys(agency.cells, latestResultsQuarters, `${agency.key} quarter`)

    for (const quarter of latestResultsQuarters) {
      const quarterCells = agency.cells[quarter]
      assertRecordKeys(
        quarterCells,
        latestResultsVendors.map(({ key }) => key),
        `${agency.key} ${quarter} vendor`,
      )

      for (const vendor of latestResultsVendors) {
        const cell = quarterCells[vendor.key]
        if (!isRecord(cell) || !Array.isArray(cell.history)) {
          throw new Error(`Invalid result cell for ${agency.key} ${quarter} ${vendor.key}`)
        }
        assertFiniteOrNull(cell.actual, `${agency.key} ${quarter} ${vendor.key} actual`)
        assertFiniteOrNull(
          cell.forecast,
          `${agency.key} ${quarter} ${vendor.key} forecast`,
        )
        for (const snapshot of cell.history) {
          if (!isRecord(snapshot) || typeof snapshot.monthLabel !== "string") {
            throw new Error(`Invalid snapshot label for ${agency.key} ${quarter} ${vendor.key}`)
          }
          if (!snapshot.monthLabel.trim() || !Number.isFinite(snapshot.value)) {
            throw new Error(`Snapshot values must be finite for ${agency.key} ${quarter} ${vendor.key}`)
          }
        }
        if (cell.actual === null && cell.forecast === null && cell.history.length > 0) {
          throw new Error(`History requires a Forecast for ${agency.key} ${quarter} ${vendor.key}`)
        }
      }
    }
  })
}

validateLatestResultsData(latestResultsAgencies)
