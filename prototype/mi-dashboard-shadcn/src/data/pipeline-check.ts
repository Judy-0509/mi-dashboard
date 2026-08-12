export const pipelineQuarters: readonly [
  "2025 Q1",
  "2025 Q2",
  "2025 Q3",
  "2025 Q4",
  "2026 Q1",
  "2026 Q2",
] = [
  "2025 Q1",
  "2025 Q2",
  "2025 Q3",
  "2025 Q4",
  "2026 Q1",
  "2026 Q2",
]

export type PipelineVendorKey = "apple" | "samsung" | "cnOem"

export const pipelineVendors: readonly {
  key: PipelineVendorKey
  label: "Apple" | "Samsung" | "CN OEM"
  color: string
}[] = [
  { key: "apple", label: "Apple", color: "#e76f51" },
  { key: "samsung", label: "Samsung", color: "#1d4ed8" },
  { key: "cnOem", label: "CN OEM", color: "#0ea5e9" },
]

export type PipelineFlowMetric = "production" | "sellIn" | "sellOut"
export type PipelineInventoryMetric =
  | "productionInventory"
  | "channelInventory"
export type PipelineValues = Record<PipelineVendorKey, number>
export type PipelineInventoryValues = Record<
  PipelineVendorKey,
  number | null
>
export type PipelineQuarter = {
  quarter: (typeof pipelineQuarters)[number]
  production: PipelineValues
  productionInventory: PipelineInventoryValues
  sellIn: PipelineValues
  channelInventory: PipelineInventoryValues
  sellOut: PipelineValues
}
export type PipelineChartPoint = PipelineValues & {
  quarter: PipelineQuarter["quarter"]
  total: number
}

export const pipelineData = [
  { quarter: "2025 Q1", production: { apple: 58, samsung: 72, cnOem: 130 }, productionInventory: { apple: 14, samsung: 18, cnOem: 25 }, sellIn: { apple: 55, samsung: 70, cnOem: 125 }, channelInventory: { apple: 16, samsung: 20, cnOem: 31 }, sellOut: { apple: 52, samsung: 68, cnOem: 121 } },
  { quarter: "2025 Q2", production: { apple: 62, samsung: 74, cnOem: 135 }, productionInventory: { apple: 15, samsung: 19, cnOem: 28 }, sellIn: { apple: 59, samsung: 72, cnOem: 130 }, channelInventory: { apple: 17, samsung: 21, cnOem: 34 }, sellOut: { apple: 57, samsung: 71, cnOem: 128 } },
  { quarter: "2025 Q3", production: { apple: 88, samsung: 77, cnOem: 139 }, productionInventory: { apple: 20, samsung: 18, cnOem: 31 }, sellIn: { apple: 80, samsung: 75, cnOem: 136 }, channelInventory: { apple: 24, samsung: 20, cnOem: 36 }, sellOut: { apple: 74, samsung: 76, cnOem: 132 } },
  { quarter: "2025 Q4", production: { apple: 76, samsung: 80, cnOem: 142 }, productionInventory: { apple: 18, samsung: 20, cnOem: 34 }, sellIn: { apple: 79, samsung: 78, cnOem: 138 }, channelInventory: { apple: 19, samsung: 22, cnOem: 37 }, sellOut: { apple: 82, samsung: 77, cnOem: 135 } },
  { quarter: "2026 Q1", production: { apple: 66, samsung: 83, cnOem: 146 }, productionInventory: { apple: 16, samsung: 21, cnOem: 36 }, sellIn: { apple: 64, samsung: 81, cnOem: 142 }, channelInventory: { apple: 18, samsung: 24, cnOem: 41 }, sellOut: { apple: 63, samsung: 79, cnOem: 139 } },
  { quarter: "2026 Q2", production: { apple: 72, samsung: 86, cnOem: 151 }, productionInventory: { apple: 18, samsung: 22, cnOem: 40 }, sellIn: { apple: 69, samsung: 84, cnOem: 145 }, channelInventory: { apple: 20, samsung: 25, cnOem: 45 }, sellOut: { apple: 68, samsung: 82, cnOem: 141 } },
] as const satisfies readonly PipelineQuarter[]

const formatMu = (value: number) => `${value.toFixed(1)}Mu`
const formatSignedMu = (value: number) =>
  `${value >= 0 ? "+" : ""}${formatMu(value)}`

function getPipelineMetricTotal(
  values: PipelineValues | PipelineInventoryValues,
): number {
  return Object.values(values).reduce<number>(
    (total, value) => total + (value ?? 0),
    0,
  )
}

export function getPipelineChartData(
  metric: PipelineFlowMetric,
): PipelineChartPoint[] {
  return pipelineData.map((row) => {
    const values = row[metric]
    return {
      quarter: row.quarter,
      ...values,
      total: Number(getPipelineMetricTotal(values).toFixed(1)),
    }
  })
}

const pipelineFlowTotals = pipelineData.flatMap((row) =>
  (['production', 'sellIn', 'sellOut'] as const).map((metric) =>
    getPipelineMetricTotal(row[metric]),
  ),
)
const pipelineYAxisMaximum =
  Math.ceil(Math.max(...pipelineFlowTotals) / 50) * 50

export const pipelineYAxisDomain: readonly [0, number] = [
  0,
  pipelineYAxisMaximum,
]
export const pipelineYAxisTicks: readonly number[] = Array.from(
  { length: pipelineYAxisMaximum / 50 + 1 },
  (_, index) => index * 50,
)

const latestPipelineQuarter = pipelineData.at(-1)!
const previousPipelineQuarter = pipelineData.at(-2)!
const latestProduction = getPipelineMetricTotal(latestPipelineQuarter.production)
const latestSellIn = getPipelineMetricTotal(latestPipelineQuarter.sellIn)
const latestSellOut = getPipelineMetricTotal(latestPipelineQuarter.sellOut)
const latestProductionInventory = getPipelineMetricTotal(
  latestPipelineQuarter.productionInventory,
)
const latestChannelInventory = getPipelineMetricTotal(
  latestPipelineQuarter.channelInventory,
)
const previousProductionInventory = getPipelineMetricTotal(
  previousPipelineQuarter.productionInventory,
)
const previousChannelInventory = getPipelineMetricTotal(
  previousPipelineQuarter.channelInventory,
)
const productionInventoryDelta =
  latestProductionInventory - previousProductionInventory
const channelInventoryDelta = latestChannelInventory - previousChannelInventory
const inventoryDeltaSummary =
  productionInventoryDelta === channelInventoryDelta
    ? formatSignedMu(productionInventoryDelta)
    : `${formatSignedMu(productionInventoryDelta)}·${formatSignedMu(channelInventoryDelta)}`
const highestChannelInventory = pipelineVendors.reduce((highest, vendor) =>
  (latestPipelineQuarter.channelInventory[vendor.key] ?? 0) > highest.value
    ? {
        label: vendor.label,
        value: latestPipelineQuarter.channelInventory[vendor.key] ?? 0,
      }
    : highest,
  { label: pipelineVendors[0].label, value: 0 },
)

export const pipelineExecutiveSummary: readonly [string, string, string] = [
  `${latestPipelineQuarter.quarter} Production ${formatMu(latestProduction)} → Sell-in ${formatMu(latestSellIn)} → Sell-out ${formatMu(latestSellOut)}로 단계별 격차 ${formatMu(latestProduction - latestSellIn)}·${formatMu(latestSellIn - latestSellOut)}임`,
  `Production Inventory ${formatMu(latestProductionInventory)}, Channel Inventory ${formatMu(latestChannelInventory)}로 전분기 대비 각각 ${inventoryDeltaSummary} 증가함`,
  `${highestChannelInventory.label} Channel Inventory가 ${formatMu(highestChannelInventory.value)}로 가장 높아 재고 축적 여부 확인 필요`,
]
