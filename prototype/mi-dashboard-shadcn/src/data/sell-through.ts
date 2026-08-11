import {
  normalizeProviderValue,
  withVendorAdditions,
  type CanonicalVendorKey,
  type VendorCatalogEntry,
  type VendorStatus,
  type VendorValue,
} from "./vendor-catalog.ts"

export type SellThroughMonth =
  | "2025-09" | "2025-10" | "2025-11" | "2025-12"
  | "2026-01" | "2026-02" | "2026-03" | "2026-04"
  | "2026-05" | "2026-06" | "2026-07" | "2026-08"

export type SellThroughVendorKey = CanonicalVendorKey | "others"

export interface SellThroughVendorMonth {
  month: SellThroughMonth
  sellIn: Record<SellThroughVendorKey, VendorValue<number>>
  sellThrough: Record<SellThroughVendorKey, VendorValue<number>>
}

export interface InventorySnapshotRow {
  vendor: SellThroughVendorKey
  inventory: readonly [VendorValue<number>, VendorValue<number>, VendorValue<number>]
  wos: readonly [VendorValue<number>, VendorValue<number>, VendorValue<number>]
}

export interface SellThroughTotals {
  sellIn: number | null
  sellThrough: number | null
  ratio: number | null
}

export const sellThroughMonths = [
  "2025-09", "2025-10", "2025-11", "2025-12",
  "2026-01", "2026-02", "2026-03", "2026-04",
  "2026-05", "2026-06", "2026-07", "2026-08",
] as const satisfies readonly SellThroughMonth[]

const vendorEntries = withVendorAdditions([
  { key: "others", label: "Others", color: "var(--chart-7)" },
]) as readonly (VendorCatalogEntry & { readonly key: SellThroughVendorKey })[]

const parseNumber = (raw: unknown) =>
  typeof raw === "number" && Number.isFinite(raw) && raw >= 0 ? raw : null

type RawSellThroughVendorMonth = {
  month: SellThroughMonth
  sellIn: Partial<Record<SellThroughVendorKey, unknown>>
  sellThrough: Partial<Record<SellThroughVendorKey, unknown>>
}

type RawInventorySnapshotRow = {
  vendor: SellThroughVendorKey
  inventory: readonly [unknown, unknown, unknown]
  wos: readonly [unknown, unknown, unknown]
}

const rawSellThroughMonthly: readonly RawSellThroughVendorMonth[] = [
  {
    month: "2025-09",
    sellIn: { apple: 49, samsung: 57, xiaomi: 33, oppo: 24, vivo: 19, transsion: 23, others: 15 },
    sellThrough: { apple: 46, samsung: 53, xiaomi: 31, oppo: 23, vivo: 18, transsion: 22, others: 14 },
  },
  {
    month: "2025-10",
    sellIn: { apple: 47, samsung: 54, xiaomi: 35, oppo: 25, vivo: 20, transsion: 24, others: 16 },
    sellThrough: { apple: 45, samsung: 51, xiaomi: 33, oppo: 24, vivo: 19, transsion: 22, others: 15 },
  },
  {
    month: "2025-11",
    sellIn: { apple: 56, samsung: 60, xiaomi: 39, oppo: 28, vivo: 22, transsion: 27, others: 17 },
    sellThrough: { apple: 53, samsung: 57, xiaomi: 37, oppo: 26, vivo: 21, transsion: 25, others: 16 },
  },
  {
    month: "2025-12",
    sellIn: { apple: 75, samsung: 69, xiaomi: 42, oppo: 31, vivo: 24, transsion: 27, others: 18 },
    sellThrough: { apple: 70, samsung: 66, xiaomi: 40, oppo: 29, vivo: 23, transsion: 25, others: 17 },
  },
  {
    month: "2026-01",
    sellIn: { apple: 53, samsung: 59, xiaomi: 37, oppo: 26, vivo: 22, transsion: 23, others: 16 },
    sellThrough: { apple: 50, samsung: 56, xiaomi: 35, oppo: 25, vivo: 21, transsion: 22, others: 15 },
  },
  {
    month: "2026-02",
    sellIn: { apple: 51, samsung: 57, xiaomi: 39, oppo: 28, vivo: 23, transsion: 25, others: 17 },
    sellThrough: { apple: 49, samsung: 54, xiaomi: 37, oppo: 27, vivo: 22, transsion: 23, others: 16 },
  },
  {
    month: "2026-03",
    sellIn: { apple: 60, samsung: 63, xiaomi: 43, oppo: 31, vivo: 25, transsion: 28, others: 19 },
    sellThrough: { apple: 57, samsung: 60, xiaomi: 41, oppo: 30, vivo: 24, transsion: 26, others: 18 },
  },
  {
    month: "2026-04",
    sellIn: { apple: 80, samsung: 72, xiaomi: 46, oppo: 35, vivo: 28, transsion: 31, others: 21 },
    sellThrough: { apple: 75, samsung: 68, xiaomi: 44, oppo: 33, vivo: 27, transsion: 29, others: 20 },
  },
  {
    month: "2026-05",
    sellIn: { apple: 57, samsung: 62, xiaomi: 41, oppo: 29, vivo: 24, transsion: 26, others: 18 },
    sellThrough: { apple: 54, samsung: 59, xiaomi: 39, oppo: 28, vivo: 23, transsion: 24, others: 17 },
  },
  {
    month: "2026-06",
    sellIn: { apple: 55, samsung: 60, xiaomi: 43, oppo: 31, vivo: 25, transsion: 29, others: 20 },
    sellThrough: { apple: 52, samsung: 57, xiaomi: 41, oppo: 30, vivo: 24, transsion: 27, others: 19 },
  },
  {
    month: "2026-07",
    sellIn: { apple: 64, samsung: 66, xiaomi: 47, oppo: 34, vivo: 27, transsion: 32, others: 22 },
    sellThrough: { apple: 61, samsung: 63, xiaomi: 45, oppo: 33, vivo: 26, transsion: 30, others: 21 },
  },
  {
    month: "2026-08",
    sellIn: { apple: 84, samsung: 75, xiaomi: 50, oppo: 37, vivo: 29, transsion: 35, others: 24 },
    sellThrough: { apple: 79, samsung: 71, xiaomi: 48, oppo: 36, vivo: 28, transsion: 33, others: 23 },
  },
]

function normalizeVendorValues(
  values: Partial<Record<SellThroughVendorKey, unknown>>,
) {
  return Object.fromEntries(
    vendorEntries.map(({ key }) => [key, normalizeProviderValue(values[key], parseNumber)]),
  ) as Record<SellThroughVendorKey, VendorValue<number>>
}

export const sellThroughMonthly: readonly SellThroughVendorMonth[] =
  rawSellThroughMonthly.map((point) => ({
    month: point.month,
    sellIn: normalizeVendorValues(point.sellIn),
    sellThrough: normalizeVendorValues(point.sellThrough),
  }))

export const sellThroughVendors = vendorEntries.map((vendor) => ({
  ...vendor,
  availability: sellThroughMonthly.some(
    (point) =>
      point.sellIn[vendor.key].status === "available" ||
      point.sellThrough[vendor.key].status === "available",
  )
    ? ("available" as const)
    : ("unavailable" as const),
})) as readonly (VendorCatalogEntry & {
  readonly key: SellThroughVendorKey
  readonly availability: VendorStatus
})[]

const rawInventorySnapshots: readonly RawInventorySnapshotRow[] = [
  { vendor: "apple", inventory: [12, 10, 8], wos: [4.2, 3.5, 2.8] },
  { vendor: "samsung", inventory: [14, 12, 10], wos: [4.8, 4.1, 3.4] },
  { vendor: "xiaomi", inventory: [9, 8, 7], wos: [3.6, 3.1, 2.7] },
  { vendor: "oppo", inventory: [7, 6, 5], wos: [3.2, 2.8, 2.4] },
  { vendor: "vivo", inventory: [6, 5, 4], wos: [3.0, 2.6, 2.2] },
  { vendor: "transsion", inventory: [8, 7, 6], wos: [3.8, 3.3, 2.9] },
  { vendor: "others", inventory: [5, 4, 3], wos: [2.7, 2.3, 1.9] },
]

const normalizeSnapshotValues = (values: readonly unknown[]) =>
  values.map((value) => normalizeProviderValue(value, parseNumber)) as [
    VendorValue<number>,
    VendorValue<number>,
    VendorValue<number>,
  ]

export const inventorySnapshots: readonly InventorySnapshotRow[] = vendorEntries.map(
  ({ key }) => {
    const source = rawInventorySnapshots.find((row) => row.vendor === key)
    return {
      vendor: key,
      inventory: normalizeSnapshotValues(source?.inventory ?? [null, null, null]),
      wos: normalizeSnapshotValues(source?.wos ?? [null, null, null]),
    }
  },
)

export function getSellThroughRatio(
  sellIn: number,
  sellThrough: number,
): number | null {
  if (sellThrough === 0) return null
  return Number(((sellIn / sellThrough) * 100).toFixed(1))
}

export function getSellThroughTotals(
  point: SellThroughVendorMonth,
): SellThroughTotals {
  return getSellThroughVendorTotals(point)
}

export function getSellThroughVendorTotals(
  point: SellThroughVendorMonth,
  vendorKeys: readonly SellThroughVendorKey[] = sellThroughVendors.map(
    ({ key }) => key,
  ),
): SellThroughTotals {
  const sellInValues = vendorKeys
    .map((vendorKey) => point.sellIn[vendorKey])
    .filter(
      (value): value is { status: "available"; value: number } =>
        value.status === "available",
    )
  const sellThroughValues = vendorKeys
    .map((vendorKey) => point.sellThrough[vendorKey])
    .filter(
      (value): value is { status: "available"; value: number } =>
        value.status === "available",
    )
  const sellIn = sellInValues.length
    ? sellInValues.reduce((total, value) => total + value.value, 0)
    : null
  const sellThrough = sellThroughValues.length
    ? sellThroughValues.reduce((total, value) => total + value.value, 0)
    : null

  return {
    sellIn,
    sellThrough,
    ratio:
      sellIn === null || sellThrough === null
        ? null
        : getSellThroughRatio(sellIn, sellThrough),
  }
}
