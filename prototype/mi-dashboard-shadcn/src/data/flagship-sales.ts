export type FlagshipSalesMonth =
  | "2025-09"
  | "2025-10"
  | "2025-11"
  | "2025-12"
  | "2026-01"
  | "2026-02"
  | "2026-03"
  | "2026-04"
  | "2026-05"
  | "2026-06"
  | "2026-07"
  | "2026-08"

export type FlagshipSalesVendorKey =
  | "apple"
  | "samsung"
  | "xiaomi"
  | "oppo"
  | "vivo"
  | "honor"
  | "google"

export type FlagshipSalesView = "calendar" | "launch"

export interface FlagshipSalesModel {
  key: string
  vendor: FlagshipSalesVendorKey
  label: string
  releaseMonth: FlagshipSalesMonth
  color: string
  monthlySales: Readonly<Record<FlagshipSalesMonth, number>>
}

export interface FlagshipSalesVendor {
  key: FlagshipSalesVendorKey
  label: string
  color: string
  models: readonly FlagshipSalesModel[]
}

export interface FlagshipSalesChartPoint {
  period: string
  label: string
  total: number
  topModelKey: string
  [modelKey: string]: number | string
}

export const flagshipSalesMonths = [
  "2025-09",
  "2025-10",
  "2025-11",
  "2025-12",
  "2026-01",
  "2026-02",
  "2026-03",
  "2026-04",
  "2026-05",
  "2026-06",
  "2026-07",
  "2026-08",
] as const satisfies readonly FlagshipSalesMonth[]

const monthIndex = new Map(
  flagshipSalesMonths.map((month, index) => [month, index]),
)

function makeModel(
  vendor: FlagshipSalesVendorKey,
  key: string,
  label: string,
  releaseMonth: FlagshipSalesMonth,
  color: string,
  salesFromLaunch: readonly number[],
): FlagshipSalesModel {
  const releaseIndex = monthIndex.get(releaseMonth) ?? 0
  const monthlySales = Object.fromEntries(
    flagshipSalesMonths.map((month, index) => [
      month,
      index < releaseIndex ? 0 : (salesFromLaunch[index - releaseIndex] ?? 0),
    ]),
  ) as Record<FlagshipSalesMonth, number>

  return {
    key,
    vendor,
    label,
    releaseMonth,
    color,
    monthlySales,
  }
}

const appleModels = [
  makeModel("apple", "iphone17ProMax", "iPhone 17 Pro Max", "2025-09", "#1e3a8a", [28, 32, 29, 24, 22, 20, 17, 15, 13, 12, 10, 9]),
  makeModel("apple", "iphone17Pro", "iPhone 17 Pro", "2025-09", "#2563eb", [24, 27, 25, 21, 19, 17, 15, 13, 12, 10, 9, 8]),
  makeModel("apple", "iphone17", "iPhone 17", "2025-09", "#93c5fd", [19, 22, 20, 17, 16, 14, 12, 11, 10, 9, 8, 7]),
] as const

const samsungModels = [
  makeModel("samsung", "galaxyS26Ultra", "Galaxy S26 Ultra", "2026-02", "#134e4a", [30, 35, 32, 28, 25, 22, 20]),
  makeModel("samsung", "galaxyS26Plus", "Galaxy S26+", "2026-02", "#0d9488", [23, 27, 25, 22, 19, 17, 15]),
  makeModel("samsung", "galaxyZFold7", "Galaxy Z Fold7", "2025-09", "#5eead4", [14, 16, 15, 13, 12, 11, 10, 9, 8, 7, 6, 5]),
] as const

const xiaomiModels = [
  makeModel("xiaomi", "xiaomi16Ultra", "Xiaomi 16 Ultra", "2025-10", "#c2410c", [22, 27, 25, 22, 19, 17, 15, 13, 12, 10, 9]),
  makeModel("xiaomi", "xiaomi16Pro", "Xiaomi 16 Pro", "2025-10", "#ea580c", [18, 22, 20, 18, 16, 14, 12, 11, 10, 8, 7]),
  makeModel("xiaomi", "xiaomiMixFold", "Xiaomi Mix Fold 5", "2026-04", "#fdba74", [12, 14, 13, 11, 10]),
] as const

const oppoModels = [
  makeModel("oppo", "oppoFindX9Ultra", "Find X9 Ultra", "2025-11", "#15803d", [20, 24, 22, 19, 17, 15, 13, 12, 10, 9]),
  makeModel("oppo", "oppoFindX9Pro", "Find X9 Pro", "2025-11", "#16a34a", [16, 19, 18, 16, 14, 12, 11, 10, 9, 8]),
  makeModel("oppo", "oppoFindN6", "Find N6", "2026-03", "#86efac", [11, 14, 13, 11, 10, 9]),
] as const

const vivoModels = [
  makeModel("vivo", "vivoX300Ultra", "vivo X300 Ultra", "2025-10", "#5b21b6", [19, 23, 21, 18, 16, 14, 12, 11, 10, 9, 8]),
  makeModel("vivo", "vivoX300Pro", "vivo X300 Pro", "2025-10", "#7c3aed", [15, 18, 17, 15, 13, 12, 10, 9, 8, 7, 6]),
  makeModel("vivo", "vivoXFold5", "vivo X Fold5", "2026-05", "#c4b5fd", [10, 12, 11, 10]),
] as const

const honorModels = [
  makeModel("honor", "honorMagic8Pro", "Magic8 Pro", "2025-12", "#9d174d", [17, 21, 19, 17, 15, 13, 12, 10, 9]),
  makeModel("honor", "honorMagic8", "Magic8", "2025-12", "#db2777", [13, 16, 15, 13, 12, 10, 9, 8, 7]),
  makeModel("honor", "honorMagicV6", "Magic V6", "2026-06", "#f9a8d4", [9, 11, 10]),
] as const

const googleModels = [
  makeModel("google", "pixel10ProXL", "Pixel 10 Pro XL", "2025-09", "#a16207", [14, 17, 16, 14, 12, 11, 10, 9, 8, 7, 6, 5]),
  makeModel("google", "pixel10Pro", "Pixel 10 Pro", "2025-09", "#ca8a04", [11, 14, 13, 11, 10, 9, 8, 7, 6, 5, 5, 4]),
  makeModel("google", "pixel10Fold", "Pixel 10 Pro Fold", "2026-06", "#fde68a", [8, 10, 9]),
] as const

export const flagshipSalesVendors = [
  { key: "apple", label: "Apple", color: "#2563eb", models: appleModels },
  { key: "samsung", label: "Samsung", color: "#0d9488", models: samsungModels },
  { key: "xiaomi", label: "Xiaomi", color: "#ea580c", models: xiaomiModels },
  { key: "oppo", label: "OPPO", color: "#16a34a", models: oppoModels },
  { key: "vivo", label: "vivo", color: "#7c3aed", models: vivoModels },
  { key: "honor", label: "Honor", color: "#db2777", models: honorModels },
  { key: "google", label: "Google", color: "#ca8a04", models: googleModels },
] as const satisfies readonly FlagshipSalesVendor[]

export const flagshipSalesModels = flagshipSalesVendors.flatMap(
  ({ models }) => models,
)

function getVendor(vendorKey: FlagshipSalesVendorKey) {
  return flagshipSalesVendors.find(({ key }) => key === vendorKey) ?? flagshipSalesVendors[0]
}

export function getFlagshipSalesLifecycle(
  model: FlagshipSalesModel,
): readonly number[] {
  const releaseIndex = monthIndex.get(model.releaseMonth) ?? 0
  return Array.from({ length: 12 }, (_, age) =>
    model.monthlySales[flagshipSalesMonths[releaseIndex + age]] ?? 0,
  )
}

export function getFlagshipSalesChartData(
  vendorKey: FlagshipSalesVendorKey,
  view: FlagshipSalesView,
  modelKeys: readonly string[],
): readonly FlagshipSalesChartPoint[] {
  const vendor = getVendor(vendorKey)
  const visibleModels = vendor.models.filter(({ key }) => modelKeys.includes(key))
  const periods =
    view === "calendar"
      ? flagshipSalesMonths.map((month) => ({ period: month, label: month }))
      : Array.from({ length: 12 }, (_, age) => ({
          period: age === 0 ? "M0" : `M+${age}`,
          label: age === 0 ? "M0" : `M+${age}`,
        }))

  return periods.map(({ period, label }, periodIndex) => {
    const point = { period, label, total: 0, topModelKey: "" } as FlagshipSalesChartPoint

    visibleModels.forEach((model) => {
      const value =
        view === "calendar"
          ? model.monthlySales[period as FlagshipSalesMonth]
          : getFlagshipSalesLifecycle(model)[periodIndex]
      point[model.key] = value ?? 0
      point.total += value ?? 0
      if (value && value > 0) point.topModelKey = model.key
    })

    return point
  })
}

export function getFlagshipSalesVendorTotal(
  vendorKey: FlagshipSalesVendorKey,
  view: FlagshipSalesView,
  modelKeys: readonly string[],
): number {
  return getFlagshipSalesChartData(vendorKey, view, modelKeys).reduce(
    (total, point) => total + point.total,
    0,
  )
}
