export interface VendorCatalogEntry {
  readonly key: string
  readonly label: string
  readonly color: string
}

export type CanonicalVendorKey =
  | "apple"
  | "samsung"
  | "xiaomi"
  | "huawei"
  | "honor"
  | "oppo"
  | "vivo"
  | "transsion"
  | "lenovo"
  | "google"

export const canonicalVendors = [
  { key: "apple", label: "Apple", color: "#e76f51" },
  { key: "samsung", label: "Samsung", color: "#1d4ed8" },
  { key: "xiaomi", label: "Xiaomi", color: "#bae6fd" },
  { key: "huawei", label: "Huawei", color: "#7dd3fc" },
  { key: "honor", label: "Honor", color: "#38bdf8" },
  { key: "oppo", label: "OPPO", color: "#0ea5e9" },
  { key: "vivo", label: "vivo", color: "#0284c7" },
  { key: "transsion", label: "Transsion", color: "#0369a1" },
  { key: "lenovo", label: "Lenovo", color: "#075985" },
  { key: "google", label: "Google", color: "#34a853" },
] as const satisfies readonly (VendorCatalogEntry & {
  readonly key: CanonicalVendorKey
})[]

const chartTokenLabelColor: Record<
  string,
  "var(--foreground)" | "var(--background)"
> = {
  "var(--chart-1)": "var(--foreground)",
  "var(--chart-2)": "var(--foreground)",
  "var(--chart-3)": "var(--background)",
  "var(--chart-4)": "var(--background)",
  "var(--chart-5)": "var(--background)",
  "var(--chart-6)": "var(--foreground)",
  "var(--chart-7)": "var(--background)",
}

export function getVendorLabelColor(color: string) {
  if (chartTokenLabelColor[color]) return chartTokenLabelColor[color]

  const channels = color
    .replace("#", "")
    .match(/.{2}/g)
    ?.map((channel) => Number.parseInt(channel, 16))
  if (!channels || channels.length !== 3) return "var(--foreground)"
  const luminance =
    (channels[0] * 299 + channels[1] * 587 + channels[2] * 114) / 1000
  return luminance > 150 ? "var(--foreground)" : "var(--background)"
}

export type VendorStatus = "available" | "unavailable"

export type VendorValue<T> =
  | { status: "available"; value: T }
  | { status: "unavailable"; value: null }

function normalizeKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, "")
}

export function normalizeProviderVendorName(
  name: unknown,
  aliases: Readonly<Record<string, CanonicalVendorKey>>,
): CanonicalVendorKey | null {
  if (typeof name !== "string") return null

  const normalizedName = normalizeKey(name)
  const normalizedAliases = Object.fromEntries(
    Object.entries(aliases).map(([alias, key]) => [normalizeKey(alias), key]),
  )
  return normalizedAliases[normalizedName] ?? null
}

export function normalizeProviderValue<T>(
  raw: unknown,
  parse: (raw: unknown) => T | null,
): VendorValue<T> {
  if (raw === undefined || raw === null) {
    return { status: "unavailable", value: null }
  }

  try {
    const value = parse(raw)
    if (value === null || value === undefined) {
      return { status: "unavailable", value: null }
    }
    if (typeof value === "number" && !Number.isFinite(value)) {
      return { status: "unavailable", value: null }
    }
    return { status: "available", value }
  } catch {
    return { status: "unavailable", value: null }
  }
}

export function withVendorAdditions(
  additions: readonly VendorCatalogEntry[],
): readonly VendorCatalogEntry[] {
  const canonicalKeys = new Set<string>(canonicalVendors.map(({ key }) => key))
  const seen = new Set<string>()
  for (const addition of additions) {
    if (canonicalKeys.has(addition.key) || seen.has(addition.key)) {
      throw new Error(`Duplicate vendor key: ${addition.key}`)
    }
    seen.add(addition.key)
  }

  return [...canonicalVendors, ...additions]
}
