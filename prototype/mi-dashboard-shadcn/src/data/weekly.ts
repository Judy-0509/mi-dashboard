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
export const weeklyVendors = [
  "Apple",
  "Samsung",
  "Xiaomi",
  "OPPO",
  "vivo",
  "Honor",
  "Others",
] as const

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

export const weeklyVendorColors: Record<
  (typeof weeklyVendors)[number],
  string
> = {
  Apple: "var(--chart-1)",
  Samsung: "var(--chart-2)",
  Xiaomi: "var(--chart-3)",
  OPPO: "var(--chart-4)",
  vivo: "var(--chart-5)",
  Honor: "var(--chart-6)",
  Others: "var(--chart-7)",
}

const round3 = (value: number) => Math.round(value * 1000) / 1000

function countriesFor(region: WeeklyRegion): Country[] {
  return region === "Total" ? (weeklyRegions.slice(1) as Country[]) : [region]
}

function weeklyUnits(
  year: number,
  country: Country,
  vendorIndex: number,
  week: number
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

export function sumWeeklySellOut(
  year: number,
  week: number,
  region: WeeklyRegion,
  vendorIndex: number | null,
  cumulative: boolean
) {
  let total = 0

  for (const country of countriesFor(region)) {
    for (
      let currentWeek = cumulative ? 1 : week;
      currentWeek <= week;
      currentWeek += 1
    ) {
      const indices =
        vendorIndex === null
          ? weeklyVendors.map((_, index) => index)
          : [vendorIndex]

      for (const index of indices) {
        total += weeklyUnits(year, country, index, currentWeek)
      }
    }
  }

  return total
}

export function getWeeklyMetric(
  week: number,
  region: WeeklyRegion,
  vendorIndex: number | null,
  metric: WeeklyMetric
) {
  if (metric === "wow" && week <= 1) {
    return null
  }

  const current = sumWeeklySellOut(
    2026,
    week,
    region,
    vendorIndex,
    metric === "yoy"
  )
  const previous =
    metric === "yoy"
      ? sumWeeklySellOut(2025, week, region, vendorIndex, true)
      : sumWeeklySellOut(2026, week - 1, region, vendorIndex, false)

  return previous === 0
    ? null
    : Math.round((current / previous - 1) * 1000) / 10
}

export function getWeeklyHeatmap(metric: WeeklyMetric) {
  return ["Total", ...weeklyVendors].map((label) => {
    const vendorIndex =
      label === "Total"
        ? null
        : weeklyVendors.indexOf(label as (typeof weeklyVendors)[number])
    return {
      label,
      values: weeklyRegions.map((region) =>
        getWeeklyMetric(weeklySelectedWeek, region, vendorIndex, metric)
      ),
    }
  })
}

export function getWeeklyCumulative(region: WeeklyRegion) {
  const segmentNames =
    region === "Total" ? weeklyRegions.slice(1) : weeklyVendors
  const years = weeklyYears.map((year) => {
    const segments = segmentNames.map((name) => {
      const value =
        region === "Total"
          ? sumWeeklySellOut(
              year,
              weeklySelectedWeek,
              name as Country,
              null,
              true
            )
          : sumWeeklySellOut(
              year,
              weeklySelectedWeek,
              region,
              weeklyVendors.indexOf(name as (typeof weeklyVendors)[number]),
              true
            )

      return {
        name,
        value: round3(value),
        color:
          region === "Total"
            ? weeklyRegionColors[name as Country]
            : weeklyVendorColors[name as (typeof weeklyVendors)[number]],
      }
    })

    return {
      year,
      total: round3(segments.reduce((sum, segment) => sum + segment.value, 0)),
      segments,
    }
  })

  return { segmentNames, years }
}

export function getWeeklyTrend(
  region: WeeklyRegion,
  vendorIndex: number | null,
  metric: WeeklyTrendMetric
): WeeklyTrendPoint[] {
  return Array.from({ length: 52 }, (_, index) => {
    const week = index + 1
    const valueFor = (year: number) => {
      if (year === 2026 && week > weeklySelectedWeek) {
        return null
      }

      const total = sumWeeklySellOut(year, week, region, null, false)
      const value = sumWeeklySellOut(year, week, region, vendorIndex, false)

      return metric === "share" && vendorIndex !== null
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
