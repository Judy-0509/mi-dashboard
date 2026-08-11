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

export type FlagshipSalesReleaseMonth = `${number}-${number}`

export type FlagshipSalesVendorKey =
  | "apple"
  | "samsung"
  | "xiaomi"
  | "oppo"
  | "vivo"
  | "honor"
  | "google"

export type FlagshipSalesView = "calendar" | "launch"

export interface FlagshipSalesSourceMetadata {
  url: string
  marketScope: string
  isEstimated: boolean
}

export interface FlagshipSalesModel {
  key: string
  vendor: FlagshipSalesVendorKey
  label: string
  releaseMonth: FlagshipSalesReleaseMonth
  color: string
  salesFromLaunch: readonly number[]
  source: FlagshipSalesSourceMetadata
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

function monthOrdinal(month: string) {
  const [year, monthNumber] = month.split("-").map(Number)
  return year * 12 + monthNumber
}

function getMonthAge(releaseMonth: string, calendarMonth: FlagshipSalesMonth) {
  return monthOrdinal(calendarMonth) - monthOrdinal(releaseMonth)
}

function makeSource(
  url: string,
  marketScope: string,
): FlagshipSalesSourceMetadata {
  return { url, marketScope, isEstimated: true }
}

function makeModel(
  vendor: FlagshipSalesVendorKey,
  key: string,
  label: string,
  releaseMonth: FlagshipSalesReleaseMonth,
  color: string,
  salesFromLaunch: readonly number[],
  source: FlagshipSalesSourceMetadata,
): FlagshipSalesModel {
  return {
    key,
    vendor,
    label,
    releaseMonth,
    color,
    salesFromLaunch,
    source,
  }
}

const appleModels = [
  makeModel("apple", "iphone17", "iPhone 17", "2025-09", "#93c5fd", [19, 22, 20, 17, 16, 14, 12, 11, 10, 9, 8, 7], makeSource("https://www.apple.com/newsroom/2025/09/apple-debuts-iphone-17/", "Global")),
  makeModel("apple", "iphoneAir", "iPhone Air", "2025-09", "#60a5fa", [12, 15, 14, 12, 11, 10, 9, 8, 7, 6, 5, 4], makeSource("https://www.apple.com/newsroom/2025/09/introducing-iphone-air-a-powerful-new-iphone-with-a-breakthrough-design/", "Global")),
  makeModel("apple", "iphone17Pro", "iPhone 17 Pro", "2025-09", "#2563eb", [24, 27, 25, 21, 19, 17, 15, 13, 12, 10, 9, 8], makeSource("https://www.apple.com/newsroom/2025/09/apple-unveils-iphone-17-pro-and-iphone-17-pro-max/", "Global")),
  makeModel("apple", "iphone17ProMax", "iPhone 17 Pro Max", "2025-09", "#1e3a8a", [28, 32, 29, 24, 22, 20, 17, 15, 13, 12, 10, 9], makeSource("https://www.apple.com/newsroom/2025/09/apple-unveils-iphone-17-pro-and-iphone-17-pro-max/", "Global")),
] as const

const samsungModels = [
  makeModel("samsung", "galaxyS25", "Galaxy S25", "2025-02", "#99f6e4", [24, 28, 26, 22, 19, 17, 15, 13, 12, 11, 10, 9], makeSource("https://news.samsung.com/global/samsung-galaxy-s25-series-arrives-worldwide/", "Global")),
  makeModel("samsung", "galaxyS25Plus", "Galaxy S25+", "2025-02", "#5eead4", [20, 24, 22, 19, 17, 15, 13, 12, 10, 9, 8, 7], makeSource("https://news.samsung.com/global/samsung-galaxy-s25-series-arrives-worldwide/", "Global")),
  makeModel("samsung", "galaxyS25Ultra", "Galaxy S25 Ultra", "2025-02", "#0d9488", [30, 35, 32, 28, 25, 22, 20, 18, 16, 14, 12, 11], makeSource("https://news.samsung.com/global/samsung-galaxy-s25-series-arrives-worldwide/", "Global")),
  makeModel("samsung", "galaxyZFold7", "Galaxy Z Fold7", "2025-07", "#134e4a", [14, 17, 16, 14, 12, 11, 10, 9, 8, 7, 6, 5], makeSource("https://news.samsung.com/us/samsung-elevates-foldable-era-everyday-well-being-global-launch-galaxy-z-fold7-galaxy-z-flip7-galaxy-watch8-series/", "Global")),
  makeModel("samsung", "galaxyZFlip7", "Galaxy Z Flip7", "2025-07", "#2dd4bf", [18, 21, 20, 17, 15, 13, 12, 10, 9, 8, 7, 6], makeSource("https://news.samsung.com/us/samsung-elevates-foldable-era-everyday-well-being-global-launch-galaxy-z-fold7-galaxy-z-flip7-galaxy-watch8-series/", "Global")),
  makeModel("samsung", "galaxyS26", "Galaxy S26", "2026-03", "#164e63", [23, 27, 25, 22, 19, 17, 15, 13, 12, 11, 10, 9], makeSource("https://news.samsung.com/us/samsung-galaxy-s26-series-galaxy-buds4-series-now-available-worldwide/", "Global")),
  makeModel("samsung", "galaxyS26Plus", "Galaxy S26+", "2026-03", "#0f766e", [20, 24, 22, 19, 17, 15, 13, 12, 10, 9, 8, 7], makeSource("https://news.samsung.com/us/samsung-galaxy-s26-series-galaxy-buds4-series-now-available-worldwide/", "Global")),
  makeModel("samsung", "galaxyS26Ultra", "Galaxy S26 Ultra", "2026-03", "#115e59", [31, 36, 33, 29, 26, 23, 20, 18, 16, 14, 12, 10], makeSource("https://news.samsung.com/us/samsung-galaxy-s26-series-galaxy-buds4-series-now-available-worldwide/", "Global")),
] as const

const xiaomiModels = [
  makeModel("xiaomi", "xiaomi15TPro", "Xiaomi 15T Pro", "2025-09", "#fdba74", [18, 22, 20, 18, 16, 14, 12, 11, 10, 9, 8, 7], makeSource("https://www.mi.com/global/event/2025/xiaomi-launch-september-2025/", "Global")),
  makeModel("xiaomi", "xiaomi17", "Xiaomi 17", "2026-02", "#ea580c", [25, 30, 28, 24, 21, 19, 17, 15, 13, 12, 10, 9], makeSource("https://www.mi.com/global/product/xiaomi-17/", "Global")),
  makeModel("xiaomi", "xiaomi17Ultra", "Xiaomi 17 Ultra", "2026-02", "#9a3412", [32, 38, 35, 30, 27, 24, 21, 19, 17, 15, 13, 11], makeSource("https://www.mi.com/global/product/xiaomi-17-ultra/", "Global")),
] as const

const oppoModels = [
  makeModel("oppo", "oppoFindX9", "OPPO Find X9", "2025-10", "#86efac", [17, 21, 19, 17, 15, 13, 12, 10, 9, 8, 7, 6], makeSource("https://www.oppo.com/en/newsroom/press/oppo-find-x9-global-launch-redefines-premium-smartphone-experience/", "Global")),
  makeModel("oppo", "oppoFindX9Pro", "OPPO Find X9 Pro", "2025-10", "#16a34a", [22, 27, 24, 21, 19, 17, 15, 13, 12, 10, 9, 8], makeSource("https://www.oppo.com/en/newsroom/press/oppo-find-x9-global-launch-redefines-premium-smartphone-experience/", "Global")),
  makeModel("oppo", "oppoFindN6", "OPPO Find N6", "2026-03", "#4ade80", [13, 16, 15, 13, 11, 10, 9, 8, 7, 6, 5, 4], makeSource("https://www.oppo.com/en/newsroom/press/oppo-launches-find-n6/", "Global")),
  makeModel("oppo", "oppoFindX9Ultra", "OPPO Find X9 Ultra", "2026-04", "#15803d", [24, 29, 27, 23, 20, 18, 16, 14, 12, 11, 9, 8], makeSource("https://www.oppo.com/sg/newsroom/press/oppo-find-x9-ultra-launches-globally-meet-your-next-camera/", "Global")),
] as const

const vivoModels = [
  makeModel("vivo", "vivoXFold5", "vivo X Fold5", "2025-06", "#c4b5fd", [12, 15, 14, 12, 11, 10, 9, 8, 7, 6, 5, 4], makeSource("https://www.vivo.com.cn/vivo/param/xfold5", "China; carryover")),
  makeModel("vivo", "vivoX300", "vivo X300", "2025-10", "#a78bfa", [19, 24, 22, 19, 17, 15, 13, 12, 10, 9, 8, 7], makeSource("https://www.vivo.com/at/about-vivo/news/x300-launch", "China and selected global markets")),
  makeModel("vivo", "vivoX300Pro", "vivo X300 Pro", "2025-10", "#7c3aed", [24, 29, 27, 23, 21, 18, 16, 14, 12, 11, 9, 8], makeSource("https://www.vivo.com/at/about-vivo/news/x300-launch", "China and selected global markets")),
  makeModel("vivo", "vivoX300Ultra", "vivo X300 Ultra", "2026-04", "#5b21b6", [28, 34, 31, 27, 24, 21, 19, 17, 15, 13, 11, 10], makeSource("https://www.vivo.com/at/about-vivo/news-detail?id=804", "China and selected global markets")),
] as const

const honorModels = [
  makeModel("honor", "honorMagicV5", "HONOR Magic V5", "2025-08", "#f9a8d4", [13, 16, 15, 13, 11, 10, 9, 8, 7, 6, 5, 4], makeSource("https://www.honor.com/global/news/honor-ai-magic-v5-west-europe-launch/", "Western Europe; carryover")),
  makeModel("honor", "honorMagic8Pro", "HONOR Magic8 Pro", "2026-01", "#db2777", [22, 27, 25, 22, 19, 17, 15, 13, 12, 10, 9, 8], makeSource("https://www.honor.com/global/news/honor-magic8-launch-uk/", "UK and selected global markets")),
  makeModel("honor", "honorMagicV6", "HONOR Magic V6", "2026-06", "#9d174d", [15, 19, 17, 15, 13, 11, 10, 9, 8, 7, 6, 5], makeSource("https://www.honor.com/global/news/honor-magic-v6-launch/", "Malaysia and selected global markets")),
] as const

const googleModels = [
  makeModel("google", "pixel10", "Pixel 10", "2025-08", "#fde68a", [15, 19, 18, 16, 14, 12, 11, 10, 9, 8, 7, 6], makeSource("https://blog.google/products-and-platforms/devices/pixel/google-pixel-10-pro-xl/", "Global and selected markets; carryover")),
  makeModel("google", "pixel10Pro", "Pixel 10 Pro", "2025-08", "#fbbf24", [19, 24, 22, 20, 17, 15, 13, 12, 10, 9, 8, 7], makeSource("https://blog.google/products-and-platforms/devices/pixel/google-pixel-10-pro-xl/", "Global and selected markets; carryover")),
  makeModel("google", "pixel10ProXL", "Pixel 10 Pro XL", "2025-08", "#ca8a04", [22, 28, 26, 23, 20, 18, 16, 14, 12, 11, 9, 8], makeSource("https://blog.google/products-and-platforms/devices/pixel/google-pixel-10-pro-xl/", "Global and selected markets; carryover")),
  makeModel("google", "pixel10ProFold", "Pixel 10 Pro Fold", "2025-10", "#a16207", [12, 15, 14, 12, 11, 10, 9, 8, 7, 6, 5, 4], makeSource("https://blog.google/products-and-platforms/devices/pixel/google-pixel-10-pro-fold/", "Global and selected markets")),
] as const

export const flagshipSalesVendors = [
  { key: "apple", label: "Apple", color: "#2563eb", models: appleModels },
  { key: "samsung", label: "Samsung", color: "#0d9488", models: samsungModels },
  { key: "xiaomi", label: "Xiaomi", color: "#ea580c", models: xiaomiModels },
  { key: "oppo", label: "OPPO", color: "#16a34a", models: oppoModels },
  { key: "vivo", label: "vivo", color: "#7c3aed", models: vivoModels },
  { key: "honor", label: "HONOR", color: "#db2777", models: honorModels },
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
  return model.salesFromLaunch
}

function getFlagshipSalesCalendarValue(
  model: FlagshipSalesModel,
  month: FlagshipSalesMonth,
) {
  const age = getMonthAge(model.releaseMonth, month)
  return age < 0 ? 0 : (model.salesFromLaunch[age] ?? 0)
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
          ? getFlagshipSalesCalendarValue(model, period as FlagshipSalesMonth)
          : model.salesFromLaunch[periodIndex]
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
