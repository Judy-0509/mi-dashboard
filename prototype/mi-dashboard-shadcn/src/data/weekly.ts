import {
  withVendorAdditions,
  type CanonicalVendorKey,
  type VendorCatalogEntry,
  type VendorStatus,
} from "./vendor-catalog.ts"

export const weeklyTitle = "Global Smartphone Weekly Sell-out 현황 & Trend"
export const weeklyDescription =
  "최근 4년 주간 Sell-out 추이 · 누적 지역/OEM 구성을 M/S와 Mu 기준으로 비교합니다."
export const weeklyRegions = [
  "Total",
  "USA",
  "China",
  "Japan",
  "Europe",
  "India",
] as const
export const weeklyYears = [2023, 2024, 2025, 2026] as const
export const weeklySelectedWeek = 32

export type WeeklyVendorKey = CanonicalVendorKey | "others"

const providerVendorKeys = [
  "apple",
  "samsung",
  "xiaomi",
  "oppo",
  "vivo",
  "honor",
  "others",
] as const satisfies readonly WeeklyVendorKey[]

const providerIndexByKey = Object.fromEntries(
  providerVendorKeys.map((key, index) => [key, index]),
) as Record<string, number>

const vendorEntries = withVendorAdditions([
  { key: "others", label: "Others", color: "#475569" },
]) as readonly (VendorCatalogEntry & { readonly key: WeeklyVendorKey })[]

export const weeklyVendors = vendorEntries.map((vendor) => ({
  ...vendor,
  availability: providerIndexByKey[vendor.key] === undefined
    ? ("unavailable" as const)
    : ("available" as const),
  providerIndex: providerIndexByKey[vendor.key] ?? null,
})) as readonly (VendorCatalogEntry & {
  readonly key: WeeklyVendorKey
  readonly availability: VendorStatus
  readonly providerIndex: number | null
})[]

export type WeeklyRegion = (typeof weeklyRegions)[number]
export type WeeklyMetric = "yoy" | "wow"
export type WeeklyTrendMetric = "mu" | "share"

export type WeeklyTrendPoint = {
  week: string
  y2023: number | null
  y2024: number | null
  y2025: number | null
  y2026: number | null
}

type Country = Exclude<WeeklyRegion, "Total">

const vendorBase: Record<Country, readonly number[]> = {
  USA: [0.54, 0.39, 0.09, 0.04, 0.03, 0.02, 0.08],
  China: [0.45, 0.22, 0.82, 0.61, 0.59, 0.44, 0.26],
  Japan: [0.23, 0.09, 0.04, 0.02, 0.02, 0.01, 0.05],
  Europe: [0.42, 0.39, 0.31, 0.18, 0.16, 0.11, 0.21],
  India: [0.16, 0.41, 0.47, 0.18, 0.2, 0.12, 0.18],
}

const currentFactor: Record<Country, readonly number[]> = {
  USA: [1.08, 1.03, 1.1, 0.98, 1.02, 1.06, 1.01],
  China: [0.96, 0.91, 1.12, 1.07, 1.09, 1.15, 1.04],
  Japan: [1.05, 1.01, 1.08, 1.04, 1.06, 1.02, 1],
  Europe: [1.04, 1.02, 1.09, 1.01, 1.03, 1.08, 1.02],
  India: [1.1, 1.05, 1.13, 1.06, 1.09, 1.12, 1.05],
}

export const weeklyRegionColors: Record<Country, string> = {
  USA: "var(--chart-1)",
  China: "var(--chart-2)",
  Japan: "var(--chart-3)",
  Europe: "var(--chart-5)",
  India: "var(--chart-7)",
}

export const weeklyVendorColors = Object.fromEntries(
  weeklyVendors.map(({ key, color }) => [key, color]),
) as Record<WeeklyVendorKey, string>

const round3 = (value: number) => Math.round(value * 1000) / 1000

function countriesFor(region: WeeklyRegion): Country[] {
  return region === "Total" ? (weeklyRegions.slice(1) as Country[]) : [region]
}

function weeklyUnits(
  year: number,
  country: Country,
  vendorIndex: number,
  week: number,
) {
  const seasonal =
    1 +
    Math.sin((week + vendorIndex * 2) / 4.5) * 0.075 +
    (week > 27 ? 0.025 : 0)
  const factor =
    year === 2026
      ? currentFactor[country][vendorIndex]
      : year === 2023
        ? 0.91
        : year === 2024
          ? 0.96
          : 1
  const spike = year === 2026 && week % 7 === vendorIndex ? 1.035 : 1
  return round3(vendorBase[country][vendorIndex] * seasonal * factor * spike)
}

function providerIndexesFor(vendorKey: WeeklyVendorKey | null) {
  if (vendorKey === null) {
    return weeklyVendors
      .map(({ providerIndex }) => providerIndex)
      .filter((index): index is number => index !== null)
  }
  const providerIndex = providerIndexByKey[vendorKey]
  return providerIndex === undefined ? [] : [providerIndex]
}

export function sumWeeklySellOut(
  year: number,
  week: number,
  region: WeeklyRegion,
  vendorKey: WeeklyVendorKey | null,
  cumulative: boolean,
) {
  const providerIndexes = providerIndexesFor(vendorKey)
  let total = 0
  let hasAvailableValue = false

  for (const country of countriesFor(region)) {
    for (
      let currentWeek = cumulative ? 1 : week;
      currentWeek <= week;
      currentWeek += 1
    ) {
      for (const providerIndex of providerIndexes) {
        total += weeklyUnits(year, country, providerIndex, currentWeek)
        hasAvailableValue = true
      }
    }
  }

  return hasAvailableValue ? total : null
}

export function getWeeklyMetric(
  week: number,
  region: WeeklyRegion,
  vendorKey: WeeklyVendorKey | null,
  metric: WeeklyMetric,
) {
  if (metric === "wow" && week <= 1) {
    return null
  }

  const current = sumWeeklySellOut(
    2026,
    week,
    region,
    vendorKey,
    metric === "yoy",
  )
  const previous =
    metric === "yoy"
      ? sumWeeklySellOut(2025, week, region, vendorKey, true)
      : sumWeeklySellOut(2026, week - 1, region, vendorKey, false)

  return current === null || previous === null || previous === 0
    ? null
    : Math.round((current / previous - 1) * 1000) / 10
}

export function getWeeklyHeatmap(metric: WeeklyMetric) {
  return [
    { key: "total" as const, label: "Total" },
    ...weeklyVendors.map(({ key, label }) => ({ key, label })),
  ].map(({ key, label }) => ({
    key,
    label,
    values: weeklyRegions.map((region) =>
      getWeeklyMetric(
        weeklySelectedWeek,
        region,
        key === "total" ? null : key,
        metric,
      ),
    ),
  }))
}

function sumAvailable(values: readonly (number | null)[]) {
  const available = values.filter((value): value is number => value !== null)
  return available.length ? available.reduce((sum, value) => sum + value, 0) : null
}

export function getWeeklyRegionalCumulative(vendorKey: WeeklyVendorKey | null) {
  const segmentNames = weeklyRegions.slice(1)
  const years = weeklyYears.map((year) => {
    const segments = segmentNames.map((name) => {
      const value = sumWeeklySellOut(
        year,
        weeklySelectedWeek,
        name as Country,
        vendorKey,
        true,
      )

      return {
        name,
        value: value === null ? null : round3(value),
        color: weeklyRegionColors[name as Country],
      }
    })

    return {
      year,
      total: sumAvailable(segments.map(({ value }) => value)),
      segments,
    }
  })

  return { segmentNames, years }
}

export function getWeeklyVendorCumulative(region: WeeklyRegion) {
  const segmentNames = weeklyVendors.map(({ label }) => label)
  const years = weeklyYears.map((year) => {
    const segments = weeklyVendors.map(({ key, label, color }) => {
      const value = sumWeeklySellOut(
        year,
        weeklySelectedWeek,
        region,
        key,
        true,
      )

      return {
        name: label,
        value: value === null ? null : round3(value),
        color,
      }
    })

    return {
      year,
      total: sumAvailable(segments.map(({ value }) => value)),
      segments,
    }
  })

  return { segmentNames, years }
}

export function getWeeklyCumulative(region: WeeklyRegion) {
  return region === "Total"
    ? getWeeklyRegionalCumulative(null)
    : getWeeklyVendorCumulative(region)
}

export function getWeeklyTrend(
  region: WeeklyRegion,
  vendorKey: WeeklyVendorKey | null,
  metric: WeeklyTrendMetric,
): WeeklyTrendPoint[] {
  return Array.from({ length: 52 }, (_, index) => {
    const week = index + 1
    const valueFor = (year: number) => {
      if (year === 2026 && week > weeklySelectedWeek) {
        return null
      }

      const total = sumWeeklySellOut(year, week, region, null, false)
      const value = sumWeeklySellOut(year, week, region, vendorKey, false)
      if (total === null || value === null) return null

      return metric === "share" && vendorKey !== null
        ? round3((value / total) * 100)
        : round3(value)
    }

    return {
      week: `W${String(week).padStart(2, "0")}`,
      y2023: valueFor(2023),
      y2024: valueFor(2024),
      y2025: valueFor(2025),
      y2026: valueFor(2026),
    }
  })
}

export const weeklyExecutiveSummary = [
  `2026 W${String(weeklySelectedWeek).padStart(2, "0")} 누적 Sell-out은 YoY +${getWeeklyMetric(weeklySelectedWeek, "Total", null, "yoy")?.toFixed(1)}%로 성장 흐름을 유지함`,
  `단주 Sell-out은 WoW ${getWeeklyMetric(weeklySelectedWeek, "Total", null, "wow")?.toFixed(1)}%; India는 누적 YoY +${getWeeklyMetric(weeklySelectedWeek, "India", null, "yoy")?.toFixed(1)}%로 가장 높은 성장세`,
]
