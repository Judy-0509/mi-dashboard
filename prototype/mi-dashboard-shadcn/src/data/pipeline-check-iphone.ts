import {
  aniModels,
  aniQuarterlyProduction,
  getAniVisibleModelKeysForLineup,
  type AniLineupBucketKey,
  type AniModelKey,
  type AniModelValues,
} from "./ani.ts"
import { pipelineQuarters } from "./pipeline-check.ts"

export const iphonePipelineQuarters = pipelineQuarters
export const iphonePipelineModels = aniModels.filter((model) =>
  aniQuarterlyProduction.some(
    (row) =>
      iphonePipelineQuarters.includes(
        row.quarter as (typeof iphonePipelineQuarters)[number],
      ) && row[model.key] > 0,
  ),
)

export const iphonePipelineLineups: readonly {
  key: AniLineupBucketKey
  label: "N" | "N-1" | "N-2" | "Legacy"
}[] = [
  { key: "n", label: "N" },
  { key: "nPlus1", label: "N-1" },
  { key: "nPlus2", label: "N-2" },
  { key: "legacy", label: "Legacy" },
]

export type IPhonePipelineFlowMetric = "production" | "sellIn" | "sellOut"
export type IPhonePipelineInventoryMetric =
  | "productionInventory"
  | "channelInventory"
type IPhoneLineupValues = Record<AniLineupBucketKey, number>
type IPhonePipelineRow = {
  quarter: (typeof iphonePipelineQuarters)[number]
  production: AniModelValues
  productionInventory: IPhoneLineupValues
  sellIn: AniModelValues
  channelInventory: IPhoneLineupValues
  sellOut: AniModelValues
}

const sellInFactors = [0.93, 0.94, 0.92, 0.96, 0.95, 0.96] as const
const sellOutFactors = [0.95, 0.96, 0.94, 0.97, 0.96, 0.97] as const

function scaleModels(values: AniModelValues, factor: number): AniModelValues {
  return Object.fromEntries(
    aniModels.map((model) => [
      model.key,
      Number((values[model.key] * factor).toFixed(1)),
    ]),
  ) as AniModelValues
}

function sumModels(values: AniModelValues, keys: readonly AniModelKey[]): number {
  return Number(keys.reduce((total, key) => total + values[key], 0).toFixed(1))
}

function getLineupInventory(
  quarter: string,
  upstream: AniModelValues,
  downstream: AniModelValues,
): IPhoneLineupValues {
  return Object.fromEntries(
    iphonePipelineLineups.map(({ key }) => {
      const modelKeys = getAniVisibleModelKeysForLineup(
        quarter,
        [key],
        ["basic", "plusAir", "pro", "proMax", "e", "foldable"],
      )
      return [
        key,
        Number(
          Math.max(
            0,
            sumModels(upstream, modelKeys) - sumModels(downstream, modelKeys),
          ).toFixed(1),
        ),
      ]
    }),
  ) as IPhoneLineupValues
}

export const iphonePipelineData: readonly IPhonePipelineRow[] =
  iphonePipelineQuarters.map((quarter, index) => {
    const source = aniQuarterlyProduction.find((row) => row.quarter === quarter)!
    const production = Object.fromEntries(
      aniModels.map((model) => [model.key, source[model.key]]),
    ) as AniModelValues
    const sellIn = scaleModels(production, sellInFactors[index])
    const sellOut = scaleModels(sellIn, sellOutFactors[index])

    return {
      quarter,
      production,
      productionInventory: getLineupInventory(quarter, production, sellIn),
      sellIn,
      channelInventory: getLineupInventory(quarter, sellIn, sellOut),
      sellOut,
    }
  })

export function getIPhonePipelineChartData(metric: IPhonePipelineFlowMetric) {
  return iphonePipelineData.map((row) => {
    const topModelKey = [...iphonePipelineModels]
      .reverse()
      .find((model) => row[metric][model.key] > 0)?.key

    return {
      quarter: row.quarter,
      ...row[metric],
      total: Number(
        iphonePipelineModels
          .reduce((total, model) => total + row[metric][model.key], 0)
          .toFixed(1),
      ),
      topModelKey,
    }
  })
}

const chartTotals = iphonePipelineData.flatMap((row) =>
  (["production", "sellIn", "sellOut"] as const).map((metric) =>
    iphonePipelineModels.reduce(
      (total, model) => total + row[metric][model.key],
      0,
    ),
  ),
)
const yMaximum = Math.ceil(Math.max(...chartTotals) / 50) * 50
export const iphonePipelineYAxisDomain: readonly [0, number] = [0, yMaximum]
export const iphonePipelineYAxisTicks = Array.from(
  { length: yMaximum / 50 + 1 },
  (_, index) => index * 50,
)

const latest = iphonePipelineData.at(-1)!
const total = (metric: IPhonePipelineFlowMetric) =>
  iphonePipelineModels.reduce(
    (sum, model) => sum + latest[metric][model.key],
    0,
  )
const formatMu = (value: number) => `${value.toFixed(1)}Mu`
const newestGeneration = iphonePipelineModels
  .filter((model) => latest.production[model.key] > 0)
  .at(-1)?.generation
const newGenerationTotal = iphonePipelineModels
  .filter((model) => model.generation === newestGeneration)
  .reduce((sum, model) => sum + latest.production[model.key], 0)

export const iphonePipelineExecutiveSummary: readonly [string, string, string] = [
  `${latest.quarter} iPhone Production ${formatMu(total("production"))} → Sell-in ${formatMu(total("sellIn"))} → Sell-out ${formatMu(total("sellOut"))} 흐름임`,
  `최신 세대 ${newestGeneration?.replace("iphone", "iPhone ")} 생산은 ${formatMu(newGenerationTotal)}로 전체 생산의 ${((newGenerationTotal / total("production")) * 100).toFixed(1)}%임`,
  `N·N-1·N-2·Legacy 기준 재고 차이를 함께 확인해 세대 전환 속도 점검 필요`,
]
