import dashboardData from "./dashboard.json" with { type: "json" }

export const vendors = [
  { key: "apple", label: "Apple", color: "var(--chart-1)" },
  { key: "samsung", label: "Samsung", color: "var(--chart-2)" },
  { key: "xiaomi", label: "Xiaomi", color: "var(--chart-3)" },
  { key: "oppo", label: "OPPO", color: "var(--chart-4)" },
  { key: "vivo", label: "vivo", color: "var(--chart-5)" },
  { key: "transsion", label: "Transsion", color: "var(--chart-6)" },
  { key: "others", label: "Others", color: "var(--chart-7)" },
] as const

export type VendorKey = (typeof vendors)[number]["key"]

export type QuarterlyProduction = { quarter: string } & Record<
  VendorKey,
  number
>

export type ForecastHistoryPoint = QuarterlyProduction & {
  period: string
}

export const cumulativeProduction =
  dashboardData.quarterlyProduction as QuarterlyProduction[]

export const dashboardMeta = {
  asOf: dashboardData.asOf,
  focusQuarter: dashboardData.focusQuarter,
  firstQuarter: cumulativeProduction[0].quarter,
  lastQuarter: cumulativeProduction.at(-1)!.quarter,
}

export const executiveSummary = dashboardData.executiveSummary

const historyPeriods = [
  "5개월 전",
  "4개월 전",
  "3개월 전",
  "2개월 전",
  "1개월 전",
  "현재",
]
const revisionFactors = [0.91, 0.93, 0.95, 0.97, 0.985, 1]

export function getForecastHistory(quarter: string): ForecastHistoryPoint[] {
  const current =
    cumulativeProduction.find((item) => item.quarter === quarter) ??
    cumulativeProduction[0]

  return revisionFactors.map((factor, periodIndex) => {
    const point = {
      quarter,
      period: historyPeriods[periodIndex],
    } as ForecastHistoryPoint

    vendors.forEach((vendor, vendorIndex) => {
      const vendorAdjustment =
        (vendorIndex - 3) * 0.003 * (revisionFactors.length - 1 - periodIndex)
      point[vendor.key] = Number(
        (current[vendor.key] * (factor + vendorAdjustment)).toFixed(1)
      )
    })

    return point
  })
}

export function getProductionTotal(item: QuarterlyProduction) {
  return vendors.reduce((total, vendor) => total + item[vendor.key], 0)
}
