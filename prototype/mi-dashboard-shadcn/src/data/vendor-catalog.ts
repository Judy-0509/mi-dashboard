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
  { key: "apple", label: "Apple", color: "var(--chart-1)" },
  { key: "samsung", label: "Samsung", color: "var(--chart-2)" },
  { key: "xiaomi", label: "Xiaomi", color: "var(--chart-3)" },
  { key: "huawei", label: "Huawei", color: "var(--chart-7)" },
  { key: "honor", label: "Honor", color: "#db2777" },
  { key: "oppo", label: "OPPO", color: "var(--chart-4)" },
  { key: "vivo", label: "vivo", color: "var(--chart-5)" },
  { key: "transsion", label: "Transsion", color: "var(--chart-6)" },
  { key: "lenovo", label: "Lenovo", color: "var(--chart-7)" },
  { key: "google", label: "Google", color: "#ca8a04" },
] as const satisfies readonly (VendorCatalogEntry & {
  readonly key: CanonicalVendorKey
})[]

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
