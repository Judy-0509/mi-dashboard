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

const quarterlyFigures: Array<
  [string, number, number, number, number, number, number, number]
> = [
  ["2024 Q1", 49, 57, 33, 24, 22, 20, 78],
  ["2024 Q2", 47, 54, 35, 25, 23, 21, 76],
  ["2024 Q3", 56, 60, 39, 28, 27, 24, 83],
  ["2024 Q4", 75, 69, 42, 30, 30, 27, 89],
  ["2025 Q1", 53, 59, 37, 26, 25, 23, 81],
  ["2025 Q2", 51, 57, 39, 28, 27, 25, 79],
  ["2025 Q3", 60, 63, 43, 31, 30, 28, 86],
  ["2025 Q4", 80, 72, 46, 34, 33, 31, 94],
  ["2026 Q1", 57, 62, 41, 29, 28, 26, 84],
  ["2026 Q2", 55, 60, 43, 31, 30, 29, 82],
  ["2026 Q3", 64, 66, 47, 34, 33, 32, 90],
  ["2026 Q4", 84, 75, 50, 37, 36, 35, 98],
  ["2027 Q1", 61, 65, 45, 32, 31, 30, 87],
  ["2027 Q2", 59, 63, 47, 34, 33, 32, 85],
]

export const cumulativeProduction: QuarterlyProduction[] = quarterlyFigures.map(
  ([quarter, ...figures]) => {
    const record = { quarter } as QuarterlyProduction

    vendors.forEach((vendor, index) => {
      record[vendor.key] = figures[index]
    })

    return record
  }
)

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
