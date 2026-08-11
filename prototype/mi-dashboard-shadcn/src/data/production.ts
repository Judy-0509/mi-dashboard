import dashboardData from "./dashboard.json" with { type: "json" }
import {
  canonicalVendors,
  normalizeProviderValue,
  normalizeProviderVendorName,
  withVendorAdditions,
  type CanonicalVendorKey,
  type VendorCatalogEntry,
  type VendorStatus,
  type VendorValue,
} from "./vendor-catalog.ts"

export type VendorKey = CanonicalVendorKey | "others"

const vendorEntries = withVendorAdditions([
  { key: "others", label: "Others", color: "var(--chart-7)" },
]) as readonly (VendorCatalogEntry & { readonly key: VendorKey })[]

const providerAliases = Object.fromEntries(
  canonicalVendors.map(({ key }) => [key, key]),
) as Record<string, CanonicalVendorKey>

function parseNumber(raw: unknown) {
  if (typeof raw === "number") {
    return Number.isFinite(raw) && raw >= 0 ? raw : null
  }
  if (typeof raw === "string" && raw.trim()) {
    const value = Number(raw)
    return Number.isFinite(value) && value >= 0 ? value : null
  }
  return null
}

function normalizeValue(raw: unknown, key: VendorKey): VendorValue<number> {
  if (key === "others") {
    return normalizeProviderValue(raw, parseNumber)
  }

  const normalizedKey = normalizeProviderVendorName(key, providerAliases)
  return normalizedKey === key
    ? normalizeProviderValue(raw, parseNumber)
    : { status: "unavailable", value: null }
}

export type QuarterlyProduction = { quarter: string } & Record<
  VendorKey,
  VendorValue<number>
>

export type ForecastHistoryPoint = QuarterlyProduction & {
  period: string
}

function normalizeQuarterlyProduction(raw: Record<string, unknown>) {
  const normalized = { quarter: String(raw.quarter ?? "") } as QuarterlyProduction
  for (const vendor of vendorEntries) {
    normalized[vendor.key] = normalizeValue(raw[vendor.key], vendor.key)
  }
  return normalized
}

export const cumulativeProduction = (
  dashboardData.quarterlyProduction as readonly Record<string, unknown>[]
).map(normalizeQuarterlyProduction)

export const vendors = vendorEntries.map((vendor) => ({
  ...vendor,
  availability: cumulativeProduction.some(
    (item) => item[vendor.key].status === "available",
  )
    ? ("available" as const)
    : ("unavailable" as const),
})) as readonly (VendorCatalogEntry & {
  readonly key: VendorKey
  readonly availability: VendorStatus
})[]

export const dashboardMeta = {
  asOf: dashboardData.asOf,
  focusQuarter: dashboardData.focusQuarter,
  firstQuarter: cumulativeProduction[0].quarter,
  lastQuarter: cumulativeProduction.at(-1)!.quarter,
}

export const executiveSummary = dashboardData.executiveSummary

function availableValues(
  item: QuarterlyProduction | ForecastHistoryPoint,
  keys: readonly VendorKey[] = vendors.map(({ key }) => key),
) {
  return keys
    .map((key) => item[key])
    .filter(
      (value): value is { status: "available"; value: number } =>
        value.status === "available",
    )
}

export function getProductionTotal(item: QuarterlyProduction) {
  const values = availableValues(item)
  return values.length
    ? values.reduce((total, value) => total + value.value, 0)
    : null
}

export function getVisibleVendorTotal(
  item: QuarterlyProduction,
  visibleVendorKeys: readonly VendorKey[],
) {
  const values = availableValues(item, visibleVendorKeys)
  return values.length
    ? values.reduce((total, value) => total + value.value, 0)
    : null
}

const productionTotals = cumulativeProduction
  .map(getProductionTotal)
  .filter((value): value is number => value !== null)

export const productionYAxisDomain = [
  0,
  Math.ceil((Math.max(...productionTotals, 0) || 0) / 100) * 100,
] as const

const revisionFactors = [0.91, 0.93, 0.95, 0.97, 0.985, 1]
const revisionVendorIndex: Record<VendorKey, number> = {
  apple: 0,
  samsung: 1,
  xiaomi: 2,
  huawei: 3,
  honor: 4,
  oppo: 3,
  vivo: 4,
  transsion: 5,
  lenovo: 7,
  google: 8,
  others: 6,
}

function getHistoryPeriods(quarter: string) {
  const [year, quarterLabel] = quarter.split(" ")
  const lastRevisionMonth = Number(quarterLabel.slice(1)) * 3 - 1

  return revisionFactors.map((_, index) => {
    const date = new Date(
      Date.UTC(Number(year), lastRevisionMonth - 1 - (5 - index), 1),
    )
    const shortYear = String(date.getUTCFullYear()).slice(-2)
    const month = String(date.getUTCMonth() + 1).padStart(2, "0")
    return `${shortYear}-${month}월`
  })
}

export function getForecastHistory(quarter: string): ForecastHistoryPoint[] {
  const current =
    cumulativeProduction.find((item) => item.quarter === quarter) ??
    cumulativeProduction[0]
  const historyPeriods = getHistoryPeriods(current.quarter)

  return revisionFactors.map((factor, periodIndex) => {
    const point = {
      quarter,
      period: historyPeriods[periodIndex],
    } as ForecastHistoryPoint

    vendors.forEach((vendor) => {
      const source = current[vendor.key]
      if (source.status === "unavailable") {
        point[vendor.key] = { status: "unavailable", value: null }
        return
      }

      const vendorAdjustment =
        (revisionVendorIndex[vendor.key] - 3) *
        0.003 *
        (revisionFactors.length - 1 - periodIndex)
      point[vendor.key] = normalizeProviderValue(
        source.value * (factor + vendorAdjustment),
        (raw) =>
          typeof raw === "number" && Number.isFinite(raw)
            ? Number(raw.toFixed(1))
            : null,
      )
    })

    return point
  })
}

export function getVendorHistoryDeltas(
  history: readonly ForecastHistoryPoint[],
) {
  const previous = history.at(-2)
  const current = history.at(-1)

  return Object.fromEntries(
    vendors.map((vendor) => {
      const previousValue = previous?.[vendor.key]
      const currentValue = current?.[vendor.key]
      return [
        vendor.key,
        previousValue?.status === "available" &&
        currentValue?.status === "available"
          ? Number((currentValue.value - previousValue.value).toFixed(1))
          : null,
      ]
    }),
  ) as Record<VendorKey, number | null>
}
