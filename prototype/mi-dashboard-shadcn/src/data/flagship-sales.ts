import {
  canonicalVendors,
  type CanonicalVendorKey,
  type VendorCatalogEntry,
  type VendorStatus,
} from "./vendor-catalog.ts"

export type FlagshipSalesMonth =
  | "2024-09"
  | "2024-10"
  | "2024-11"
  | "2024-12"
  | "2025-01"
  | "2025-02"
  | "2025-03"
  | "2025-04"
  | "2025-05"
  | "2025-06"
  | "2025-07"
  | "2025-08"
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

export type FlagshipSalesVendorKey = CanonicalVendorKey

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

export interface FlagshipSalesVendor extends VendorCatalogEntry {
  key: FlagshipSalesVendorKey
  availability: VendorStatus
  models: readonly FlagshipSalesModel[]
}

export interface FlagshipSalesChartPoint {
  period: string
  label: string
  total: number
  topModelKey: string
  [modelKey: string]: number | string
}

export interface FlagshipSalesComparisonPair {
  rowLabel: string
  currentModelKey: string
  previousModelKey: string
}

export interface FlagshipSalesComparisonConfig {
  currentGenerationLabel: string
  previousGenerationLabel: string
  pairs: readonly FlagshipSalesComparisonPair[]
}

export interface FlagshipSalesComparisonRow {
  rowLabel: string
  currentModelLabel: string
  previousModelLabel: string
  duration: number | null
  currentCumulative: number
  previousCumulative: number
  deltaMu: number
  deltaPercent: number
}

export interface FlagshipSalesComparison {
  currentGenerationLabel: string
  previousGenerationLabel: string
  rows: readonly FlagshipSalesComparisonRow[]
}

export const flagshipSalesMonths = [
  "2024-09",
  "2024-10",
  "2024-11",
  "2024-12",
  "2025-01",
  "2025-02",
  "2025-03",
  "2025-04",
  "2025-05",
  "2025-06",
  "2025-07",
  "2025-08",
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
  makeModel("apple", "iphone16", "iPhone 16", "2024-09", "#bfdbfe", [18, 22, 20, 17, 15, 13, 11, 10, 9, 8, 7, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1, 1, 0, ], makeSource("https://www.apple.com/newsroom/2024/09/get-ready-to-upgrade-to-the-new-iphone-16-apple-watch-and-airpods-lineups/", "Global; carryover")),
  makeModel("apple", "iphone16Plus", "iPhone 16 Plus", "2024-09", "#a5bff4", [13, 16, 15, 13, 11, 10, 9, 8, 7, 6, 5, 4, 4, 3, 3, 2, 2, 2, 1, 1, 1, 0, 0, 0, ], makeSource("https://www.apple.com/newsroom/2024/09/get-ready-to-upgrade-to-the-new-iphone-16-apple-watch-and-airpods-lineups/", "Global; carryover")),
  makeModel("apple", "iphone16Pro", "iPhone 16 Pro", "2024-09", "#7aa7ed", [23, 27, 25, 21, 18, 16, 14, 12, 11, 10, 9, 8, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, ], makeSource("https://www.apple.com/newsroom/2024/09/apple-debuts-iphone-16-pro-and-iphone-16-pro-max/", "Global; carryover")),
  makeModel("apple", "iphone16ProMax", "iPhone 16 Pro Max", "2024-09", "#4d78c8", [27, 32, 29, 24, 21, 19, 17, 15, 13, 12, 10, 9, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, ], makeSource("https://www.apple.com/newsroom/2024/09/apple-debuts-iphone-16-pro-and-iphone-16-pro-max/", "Global; carryover")),
  makeModel("apple", "iphone17", "iPhone 17", "2025-09", "#93c5fd", [19, 22, 20, 17, 16, 14, 12, 11, 10, 9, 8, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1, ], makeSource("https://www.apple.com/newsroom/2025/09/apple-debuts-iphone-17/", "Global")),
  makeModel("apple", "iphoneAir", "iPhone Air", "2025-09", "#60a5fa", [12, 15, 14, 12, 11, 10, 9, 8, 7, 6, 5, 4, 4, 3, 3, 2, 2, 2, 1, 1, 1, 1, 0, 0, ], makeSource("https://www.apple.com/newsroom/2025/09/introducing-iphone-air-a-powerful-new-iphone-with-a-breakthrough-design/", "Global")),
  makeModel("apple", "iphone17Pro", "iPhone 17 Pro", "2025-09", "#2563eb", [24, 27, 25, 21, 19, 17, 15, 13, 12, 10, 9, 8, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, ], makeSource("https://www.apple.com/newsroom/2025/09/apple-unveils-iphone-17-pro-and-iphone-17-pro-max/", "Global")),
  makeModel("apple", "iphone17ProMax", "iPhone 17 Pro Max", "2025-09", "#1e3a8a", [28, 32, 29, 24, 22, 20, 17, 15, 13, 12, 10, 9, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, ], makeSource("https://www.apple.com/newsroom/2025/09/apple-unveils-iphone-17-pro-and-iphone-17-pro-max/", "Global")),
] as const

const samsungModels = [
  makeModel("samsung", "galaxyS24", "Galaxy S24", "2024-01", "#a7f3d0", [24, 28, 26, 22, 19, 17, 15, 13, 12, 11, 10, 9, 8, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, ], makeSource("https://news.samsung.com/global/samsung-galaxy-s24-series-is-now-available-worldwide", "Global; carryover")),
  makeModel("samsung", "galaxyS24Plus", "Galaxy S24+", "2024-01", "#6ee7b7", [20, 24, 22, 19, 17, 15, 13, 12, 10, 9, 8, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1, ], makeSource("https://news.samsung.com/global/samsung-galaxy-s24-series-is-now-available-worldwide", "Global; carryover")),
  makeModel("samsung", "galaxyS24Ultra", "Galaxy S24 Ultra", "2024-01", "#059669", [30, 35, 32, 28, 25, 22, 20, 18, 16, 14, 12, 11, 10, 9, 9, 8, 8, 7, 7, 6, 6, 5, 5, 4, ], makeSource("https://news.samsung.com/global/samsung-galaxy-s24-series-is-now-available-worldwide", "Global; carryover")),
  makeModel("samsung", "galaxyZFold6", "Galaxy Z Fold6", "2024-07", "#2f766f", [14, 17, 16, 14, 12, 11, 10, 9, 8, 7, 6, 5, 4, 4, 3, 3, 2, 2, 1, 1, 1, 0, 0, 0, ], makeSource("https://news.samsung.com/global/samsung-announces-global-availability-of-latest-devices-unveiled-at-galaxy-unpacked-in-paris", "Global; carryover")),
  makeModel("samsung", "galaxyZFlip6", "Galaxy Z Flip6", "2024-07", "#2dd4bf", [18, 21, 20, 17, 15, 13, 12, 10, 9, 8, 7, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1, 1, 0, ], makeSource("https://news.samsung.com/global/samsung-announces-global-availability-of-latest-devices-unveiled-at-galaxy-unpacked-in-paris", "Global; carryover")),
  makeModel("samsung", "galaxyS25", "Galaxy S25", "2025-02", "#99f6e4", [24, 28, 26, 22, 19, 17, 15, 13, 12, 11, 10, 9, 8, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, ], makeSource("https://news.samsung.com/global/samsung-galaxy-s25-series-arrives-worldwide/", "Global")),
  makeModel("samsung", "galaxyS25Plus", "Galaxy S25+", "2025-02", "#5eead4", [20, 24, 22, 19, 17, 15, 13, 12, 10, 9, 8, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1, ], makeSource("https://news.samsung.com/global/samsung-galaxy-s25-series-arrives-worldwide/", "Global")),
  makeModel("samsung", "galaxyS25Ultra", "Galaxy S25 Ultra", "2025-02", "#0d9488", [30, 35, 32, 28, 25, 22, 20, 18, 16, 14, 12, 11, 10, 9, 9, 8, 8, 7, 7, 6, 6, 5, 5, 4, ], makeSource("https://news.samsung.com/global/samsung-galaxy-s25-series-arrives-worldwide/", "Global")),
  makeModel("samsung", "galaxyZFold7", "Galaxy Z Fold7", "2025-07", "#134e4a", [14, 17, 16, 14, 12, 11, 10, 9, 8, 7, 6, 5, 4, 4, 3, 3, 3, 2, 2, 2, 1, 1, 1, 0, ], makeSource("https://news.samsung.com/us/samsung-elevates-foldable-era-everyday-well-being-global-launch-galaxy-z-fold7-galaxy-z-flip7-galaxy-watch8-series/", "Global")),
  makeModel("samsung", "galaxyZFlip7", "Galaxy Z Flip7", "2025-07", "#2dd4bf", [18, 21, 20, 17, 15, 13, 12, 10, 9, 8, 7, 6, 5, 5, 4, 4, 3, 3, 2, 2, 2, 1, 1, 1, ], makeSource("https://news.samsung.com/us/samsung-elevates-foldable-era-everyday-well-being-global-launch-galaxy-z-fold7-galaxy-z-flip7-galaxy-watch8-series/", "Global")),
  makeModel("samsung", "galaxyS26", "Galaxy S26", "2026-03", "#164e63", [23, 27, 25, 22, 19, 17, 15, 13, 12, 11, 10, 9, 8, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, ], makeSource("https://news.samsung.com/us/samsung-galaxy-s26-series-galaxy-buds4-series-now-available-worldwide/", "Global")),
  makeModel("samsung", "galaxyS26Plus", "Galaxy S26+", "2026-03", "#0f766e", [20, 24, 22, 19, 17, 15, 13, 12, 10, 9, 8, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1, ], makeSource("https://news.samsung.com/us/samsung-galaxy-s26-series-galaxy-buds4-series-now-available-worldwide/", "Global")),
  makeModel("samsung", "galaxyS26Ultra", "Galaxy S26 Ultra", "2026-03", "#115e59", [31, 36, 33, 29, 26, 23, 20, 18, 16, 14, 12, 10, 9, 9, 8, 8, 7, 7, 6, 6, 5, 5, 4, 4, ], makeSource("https://news.samsung.com/us/samsung-galaxy-s26-series-galaxy-buds4-series-now-available-worldwide/", "Global")),
] as const

const xiaomiModels = [
  makeModel("xiaomi", "xiaomi14TPro", "Xiaomi 14T Pro", "2024-09", "#fed7aa", [18, 22, 20, 18, 16, 14, 12, 11, 10, 9, 8, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1, ], makeSource("https://www.mi.com/global/event/2024/xiaomi-launch-september-2024", "Global; carryover")),
  makeModel("xiaomi", "xiaomi15", "Xiaomi 15", "2025-03", "#fdba74", [23, 28, 26, 22, 19, 17, 15, 13, 12, 10, 9, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, ], makeSource("https://www.mi.com/global/event/2025/xiaomi-launch-march-2025", "Global")),
  makeModel("xiaomi", "xiaomi15Ultra", "Xiaomi 15 Ultra", "2025-03", "#c2410c", [30, 36, 33, 28, 24, 21, 19, 17, 15, 13, 11, 10, 9, 9, 8, 8, 7, 7, 6, 6, 5, 5, 4, 4, ], makeSource("https://www.mi.com/global/event/2025/xiaomi-launch-march-2025", "Global")),
  makeModel("xiaomi", "xiaomi15TPro", "Xiaomi 15T Pro", "2025-09", "#fdba74", [18, 22, 20, 18, 16, 14, 12, 11, 10, 9, 8, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1, ], makeSource("https://www.mi.com/global/event/2025/xiaomi-launch-september-2025/", "Global")),
  makeModel("xiaomi", "xiaomi17", "Xiaomi 17", "2026-02", "#ea580c", [25, 30, 28, 24, 21, 19, 17, 15, 13, 12, 10, 9, 8, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, ], makeSource("https://www.mi.com/global/product/xiaomi-17/", "Global")),
  makeModel("xiaomi", "xiaomi17Ultra", "Xiaomi 17 Ultra", "2026-02", "#9a3412", [32, 38, 35, 30, 27, 24, 21, 19, 17, 15, 13, 11, 10, 10, 9, 9, 8, 8, 7, 7, 6, 6, 5, 5, ], makeSource("https://www.mi.com/global/product/xiaomi-17-ultra/", "Global")),
] as const

const oppoModels = [
  makeModel("oppo", "oppoFindX8", "OPPO Find X8", "2024-11", "#bbf7d0", [17, 21, 19, 17, 15, 13, 12, 10, 9, 8, 7, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1, 1, 0, ], makeSource("https://www.oppo.com/en/events/find-x8-series-launch/", "Global; carryover")),
  makeModel("oppo", "oppoFindX8Pro", "OPPO Find X8 Pro", "2024-11", "#4ade80", [22, 27, 24, 21, 19, 17, 15, 13, 12, 10, 9, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, ], makeSource("https://www.oppo.com/en/events/find-x8-series-launch/", "Global; carryover")),
  makeModel("oppo", "oppoFindN5", "OPPO Find N5", "2025-02", "#86efac", [13, 16, 15, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 3, 2, 2, 2, 1, 1, 1, 0, 0, 0, 0, ], makeSource("https://www.oppo.com/en/newsroom/press/find-n5-global-launch/", "Global")),
  makeModel("oppo", "oppoFindX9", "OPPO Find X9", "2025-10", "#86efac", [17, 21, 19, 17, 15, 13, 12, 10, 9, 8, 7, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1, 1, 0, ], makeSource("https://www.oppo.com/en/newsroom/press/oppo-find-x9-global-launch-redefines-premium-smartphone-experience/", "Global")),
  makeModel("oppo", "oppoFindX9Pro", "OPPO Find X9 Pro", "2025-10", "#16a34a", [22, 27, 24, 21, 19, 17, 15, 13, 12, 10, 9, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, ], makeSource("https://www.oppo.com/en/newsroom/press/oppo-find-x9-global-launch-redefines-premium-smartphone-experience/", "Global")),
  makeModel("oppo", "oppoFindN6", "OPPO Find N6", "2026-03", "#4ade80", [13, 16, 15, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 3, 2, 2, 2, 1, 1, 1, 0, 0, 0, 0, ], makeSource("https://www.oppo.com/en/newsroom/press/oppo-launches-find-n6/", "Global")),
  makeModel("oppo", "oppoFindX9Ultra", "OPPO Find X9 Ultra", "2026-04", "#15803d", [24, 29, 27, 23, 20, 18, 16, 14, 12, 11, 9, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, ], makeSource("https://www.oppo.com/sg/newsroom/press/oppo-find-x9-ultra-launches-globally-meet-your-next-camera/", "Global")),
] as const

const vivoModels = [
  makeModel("vivo", "vivoX200", "vivo X200", "2024-11", "#ddd6fe", [19, 24, 22, 19, 17, 15, 13, 12, 10, 9, 8, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1, ], makeSource("https://www.vivo.com/en/products/x200", "Global; selected markets; carryover")),
  makeModel("vivo", "vivoX200Pro", "vivo X200 Pro", "2024-11", "#a78bfa", [24, 29, 27, 23, 21, 18, 16, 14, 12, 11, 9, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, ], makeSource("https://www.vivo.com/en/products/x200-pro", "Global; selected markets; carryover")),
  makeModel("vivo", "vivoXFold5", "vivo X Fold5", "2025-06", "#c4b5fd", [12, 15, 14, 12, 11, 10, 9, 8, 7, 6, 5, 4, 4, 4, 3, 3, 2, 2, 2, 1, 1, 1, 0, 0, ], makeSource("https://www.vivo.com/en/products/x-fold5", "Global; carryover")),
  makeModel("vivo", "vivoX300", "vivo X300", "2025-10", "#a78bfa", [19, 24, 22, 19, 17, 15, 13, 12, 10, 9, 8, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1, ], makeSource("https://www.vivo.com/at/about-vivo/news/x300-launch", "China and selected global markets")),
  makeModel("vivo", "vivoX300Pro", "vivo X300 Pro", "2025-10", "#7c3aed", [24, 29, 27, 23, 21, 18, 16, 14, 12, 11, 9, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, ], makeSource("https://www.vivo.com/at/about-vivo/news/x300-launch", "China and selected global markets")),
  makeModel("vivo", "vivoX300Ultra", "vivo X300 Ultra", "2026-04", "#5b21b6", [28, 34, 31, 27, 24, 21, 19, 17, 15, 13, 11, 10, 8, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, ], makeSource("https://www.vivo.com/at/about-vivo/news-detail?id=804", "China and selected global markets")),
] as const

const honorModels = [
  makeModel("honor", "honorMagicV3", "HONOR Magic V3", "2024-09", "#fbcfe8", [13, 16, 15, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 3, 2, 2, 2, 1, 1, 1, 0, 0, 0, 0, ], makeSource("https://www.honor.com/global/news/honor-magic-v3-ifa-2024/", "Global; carryover")),
  makeModel("honor", "honorMagic7Pro", "HONOR Magic7 Pro", "2025-01", "#f472b6", [22, 27, 25, 22, 19, 17, 15, 13, 12, 10, 9, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, ], makeSource("https://www.honor.com/global/news/honor-magic7-series-launch/", "Global; selected markets")),
  makeModel("honor", "honorMagicV5", "HONOR Magic V5", "2025-08", "#f9a8d4", [13, 16, 15, 13, 11, 10, 9, 8, 7, 6, 5, 4, 4, 4, 3, 3, 2, 2, 2, 1, 1, 1, 0, 0, ], makeSource("https://www.honor.com/global/news/honor-ai-magic-v5-west-europe-launch/", "Western Europe; carryover")),
  makeModel("honor", "honorMagic8Pro", "HONOR Magic8 Pro", "2026-01", "#db2777", [22, 27, 25, 22, 19, 17, 15, 13, 12, 10, 9, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, ], makeSource("https://www.honor.com/global/news/honor-magic8-launch-uk/", "UK and selected global markets")),
  makeModel("honor", "honorMagicV6", "HONOR Magic V6", "2026-06", "#9d174d", [15, 19, 17, 15, 13, 11, 10, 9, 8, 7, 6, 5, 4, 4, 3, 3, 3, 2, 2, 2, 1, 1, 1, 0, ], makeSource("https://www.honor.com/global/news/honor-magic-v6-launch/", "Malaysia and selected global markets")),
] as const

const googleModels = [
  makeModel("google", "pixel9", "Pixel 9", "2024-08", "#fef3c7", [15, 19, 18, 16, 14, 12, 11, 10, 9, 8, 7, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1, 1, 0, ], makeSource("https://blog.google/products-and-platforms/devices/pixel/google-pixel-9-pro-xl/", "Global and selected markets; carryover")),
  makeModel("google", "pixel9Pro", "Pixel 9 Pro", "2024-09", "#fde68a", [19, 24, 22, 20, 17, 15, 13, 12, 10, 9, 8, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1, ], makeSource("https://blog.google/products-and-platforms/devices/pixel/google-pixel-9-pro-xl/", "Global and selected markets; carryover")),
  makeModel("google", "pixel9ProXL", "Pixel 9 Pro XL", "2024-08", "#fbbf24", [22, 28, 26, 23, 20, 18, 16, 14, 12, 11, 9, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, ], makeSource("https://blog.google/products-and-platforms/devices/pixel/google-pixel-9-pro-xl/", "Global and selected markets; carryover")),
  makeModel("google", "pixel9ProFold", "Pixel 9 Pro Fold", "2024-09", "#d97706", [12, 15, 14, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 3, 2, 2, 2, 1, 1, 1, 0, 0, 0, 0, ], makeSource("https://blog.google/products-and-platforms/devices/pixel/google-pixel-9-pro-fold/", "Global and selected markets; carryover")),
  makeModel("google", "pixel10", "Pixel 10", "2025-08", "#fde68a", [15, 19, 18, 16, 14, 12, 11, 10, 9, 8, 7, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1, 1, 0, ], makeSource("https://blog.google/products-and-platforms/devices/pixel/google-pixel-10-pro-xl/", "Global and selected markets; carryover")),
  makeModel("google", "pixel10Pro", "Pixel 10 Pro", "2025-08", "#fbbf24", [19, 24, 22, 20, 17, 15, 13, 12, 10, 9, 8, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1, ], makeSource("https://blog.google/products-and-platforms/devices/pixel/google-pixel-10-pro-xl/", "Global and selected markets; carryover")),
  makeModel("google", "pixel10ProXL", "Pixel 10 Pro XL", "2025-08", "#ca8a04", [22, 28, 26, 23, 20, 18, 16, 14, 12, 11, 9, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, ], makeSource("https://blog.google/products-and-platforms/devices/pixel/google-pixel-10-pro-xl/", "Global and selected markets; carryover")),
  makeModel("google", "pixel10ProFold", "Pixel 10 Pro Fold", "2025-10", "#a16207", [12, 15, 14, 12, 11, 10, 9, 8, 7, 6, 5, 4, 4, 4, 3, 3, 2, 2, 2, 1, 1, 1, 0, 0, ], makeSource("https://blog.google/products-and-platforms/devices/pixel/google-pixel-10-pro-fold/", "Global and selected markets")),
] as const

const modelsByVendor: Record<CanonicalVendorKey, readonly FlagshipSalesModel[]> = {
  apple: appleModels,
  samsung: samsungModels,
  xiaomi: xiaomiModels,
  huawei: [],
  honor: honorModels,
  oppo: oppoModels,
  vivo: vivoModels,
  transsion: [],
  lenovo: [],
  google: googleModels,
}

export const flagshipSalesVendors = canonicalVendors.map((vendor) => ({
  ...vendor,
  availability: modelsByVendor[vendor.key].length
    ? ("available" as const)
    : ("unavailable" as const),
  models: modelsByVendor[vendor.key],
})) as readonly FlagshipSalesVendor[]

export const flagshipSalesModels = flagshipSalesVendors.flatMap(
  ({ models }) => models,
)

export const flagshipSalesComparisonConfigs = {
  apple: {
    currentGenerationLabel: "iPhone 17",
    previousGenerationLabel: "iPhone 16",
    pairs: [
      { rowLabel: "Basic", currentModelKey: "iphone17", previousModelKey: "iphone16" },
      { rowLabel: "Plus/Air", currentModelKey: "iphoneAir", previousModelKey: "iphone16Plus" },
      { rowLabel: "Pro", currentModelKey: "iphone17Pro", previousModelKey: "iphone16Pro" },
      { rowLabel: "Pro Max", currentModelKey: "iphone17ProMax", previousModelKey: "iphone16ProMax" },
    ],
  },
  samsung: {
    currentGenerationLabel: "Galaxy S26",
    previousGenerationLabel: "Galaxy S25",
    pairs: [
      { rowLabel: "Basic", currentModelKey: "galaxyS26", previousModelKey: "galaxyS25" },
      { rowLabel: "Plus", currentModelKey: "galaxyS26Plus", previousModelKey: "galaxyS25Plus" },
      { rowLabel: "Ultra", currentModelKey: "galaxyS26Ultra", previousModelKey: "galaxyS25Ultra" },
    ],
  },
  xiaomi: {
    currentGenerationLabel: "Xiaomi 17",
    previousGenerationLabel: "Xiaomi 15",
    pairs: [
      { rowLabel: "Basic", currentModelKey: "xiaomi17", previousModelKey: "xiaomi15" },
      { rowLabel: "Ultra", currentModelKey: "xiaomi17Ultra", previousModelKey: "xiaomi15Ultra" },
    ],
  },
  oppo: {
    currentGenerationLabel: "OPPO Find X9",
    previousGenerationLabel: "OPPO Find X8",
    pairs: [
      { rowLabel: "Basic", currentModelKey: "oppoFindX9", previousModelKey: "oppoFindX8" },
      { rowLabel: "Pro", currentModelKey: "oppoFindX9Pro", previousModelKey: "oppoFindX8Pro" },
    ],
  },
  vivo: {
    currentGenerationLabel: "vivo X300",
    previousGenerationLabel: "vivo X200",
    pairs: [
      { rowLabel: "Basic", currentModelKey: "vivoX300", previousModelKey: "vivoX200" },
      { rowLabel: "Pro", currentModelKey: "vivoX300Pro", previousModelKey: "vivoX200Pro" },
    ],
  },
  honor: {
    currentGenerationLabel: "HONOR Magic8",
    previousGenerationLabel: "HONOR Magic7",
    pairs: [
      { rowLabel: "Pro", currentModelKey: "honorMagic8Pro", previousModelKey: "honorMagic7Pro" },
    ],
  },
  google: {
    currentGenerationLabel: "Pixel 10",
    previousGenerationLabel: "Pixel 9",
    pairs: [
      { rowLabel: "Basic", currentModelKey: "pixel10", previousModelKey: "pixel9" },
      { rowLabel: "Pro", currentModelKey: "pixel10Pro", previousModelKey: "pixel9Pro" },
      { rowLabel: "Pro XL", currentModelKey: "pixel10ProXL", previousModelKey: "pixel9ProXL" },
      { rowLabel: "Pro Fold", currentModelKey: "pixel10ProFold", previousModelKey: "pixel9ProFold" },
    ],
  },
} as const satisfies Partial<
  Record<FlagshipSalesVendorKey, FlagshipSalesComparisonConfig>
>

function getVendor(vendorKey: FlagshipSalesVendorKey) {
  return flagshipSalesVendors.find(({ key }) => key === vendorKey)
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
  if (!vendor || vendor.availability === "unavailable") return []
  const visibleModels = vendor.models.filter(({ key }) => modelKeys.includes(key))
  const periods =
    view === "calendar"
      ? flagshipSalesMonths.map((month) => ({ period: month, label: month }))
      : Array.from({ length: 24 }, (_, age) => ({
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
): number | null {
  const chartData = getFlagshipSalesChartData(vendorKey, view, modelKeys)
  if (!chartData.length) return null
  return chartData.reduce(
    (total, point) => total + point.total,
    0,
  )
}

function getFlagshipSalesModel(modelKey: string) {
  return flagshipSalesModels.find(({ key }) => key === modelKey)
}

function getComparisonDuration(model: FlagshipSalesModel) {
  const finalDashboardMonth = flagshipSalesMonths[flagshipSalesMonths.length - 1] ?? "2026-08"
  const availableMonths = getMonthAge(model.releaseMonth, finalDashboardMonth) + 1
  return Math.min(model.salesFromLaunch.length, Math.max(0, availableMonths))
}

function getCumulativeSales(model: FlagshipSalesModel, duration: number) {
  return model.salesFromLaunch
    .slice(0, duration)
    .reduce((total, value) => total + value, 0)
}

function makeComparisonRow(
  rowLabel: string,
  currentModel: FlagshipSalesModel,
  previousModel: FlagshipSalesModel,
  duration: number,
): FlagshipSalesComparisonRow {
  const currentCumulative = getCumulativeSales(currentModel, duration)
  const previousCumulative = getCumulativeSales(previousModel, duration)
  const deltaMu = currentCumulative - previousCumulative

  return {
    rowLabel,
    currentModelLabel: currentModel.label,
    previousModelLabel: previousModel.label,
    duration,
    currentCumulative,
    previousCumulative,
    deltaMu,
    deltaPercent:
      previousCumulative === 0 ? 0 : (deltaMu / previousCumulative) * 100,
  }
}

export function getFlagshipSalesGenerationComparison(
  vendorKey: FlagshipSalesVendorKey,
): FlagshipSalesComparison | null {
  const config = (
    flagshipSalesComparisonConfigs as Partial<
      Record<FlagshipSalesVendorKey, FlagshipSalesComparisonConfig>
    >
  )[vendorKey]
  const vendor = getVendor(vendorKey)
  if (!config || !vendor || vendor.availability === "unavailable") return null
  const rows = config.pairs.map(
    ({ rowLabel, currentModelKey, previousModelKey }) => {
      const currentModel = getFlagshipSalesModel(currentModelKey)
      const previousModel = getFlagshipSalesModel(previousModelKey)
      if (!currentModel || !previousModel) {
        throw new Error(
          `Missing flagship comparison model for ${vendorKey}: ${rowLabel}`,
        )
      }

      return makeComparisonRow(
        rowLabel,
        currentModel,
        previousModel,
        getComparisonDuration(currentModel),
      )
    },
  )
  const currentCumulative = rows.reduce(
    (total, row) => total + row.currentCumulative,
    0,
  )
  const previousCumulative = rows.reduce(
    (total, row) => total + row.previousCumulative,
    0,
  )
  const deltaMu = currentCumulative - previousCumulative
  const commonDuration = rows.every(
    (row) => row.duration === rows[0]?.duration,
  )
    ? rows[0]?.duration ?? null
    : null

  return {
    currentGenerationLabel: config.currentGenerationLabel,
    previousGenerationLabel: config.previousGenerationLabel,
    rows: [
      {
        rowLabel: "전체 시리즈",
        currentModelLabel: config.currentGenerationLabel,
        previousModelLabel: config.previousGenerationLabel,
        duration: commonDuration,
        currentCumulative,
        previousCumulative,
        deltaMu,
        deltaPercent:
          previousCumulative === 0 ? 0 : (deltaMu / previousCumulative) * 100,
      },
      ...rows,
    ],
  }
}
