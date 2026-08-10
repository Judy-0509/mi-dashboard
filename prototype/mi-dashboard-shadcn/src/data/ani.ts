export type AniGenerationKey = "iphone15" | "iphone16" | "iphone17" | "iphone18"

export type AniModelTypeKey =
  | "basic"
  | "plusAir"
  | "pro"
  | "proMax"
  | "e"
  | "foldable"

export type AniModelKey =
  | "iphone15Basic"
  | "iphone15Plus"
  | "iphone15Pro"
  | "iphone15ProMax"
  | "iphone16Basic"
  | "iphone16Plus"
  | "iphone16Pro"
  | "iphone16ProMax"
  | "iphone16E"
  | "iphone17Basic"
  | "iphone17Air"
  | "iphone17Pro"
  | "iphone17ProMax"
  | "iphone17E"
  | "iphone18Basic"
  | "iphone18Air"
  | "iphone18Pro"
  | "iphone18ProMax"
  | "iphone18E"
  | "iphone18Foldable"

export interface AniModel {
  key: AniModelKey
  generation: AniGenerationKey
  type: AniModelTypeKey
  label: string
  color: string
}

export type AniModelValues = Record<AniModelKey, number>
export type AniQuarterlyProduction = AniModelValues & { quarter: string }
export type AniForecastHistoryPoint = AniModelValues & {
  quarter: string
  period: string
}

export interface AniHistorySummary {
  currentTotal: number
  monthOverMonth: number
  sixMonth: number
}

export const aniModels: readonly AniModel[] = [
  { key: "iphone15Basic", generation: "iphone15", type: "basic", label: "iPhone 15 Basic", color: "#93c5fd" },
  { key: "iphone15Plus", generation: "iphone15", type: "plusAir", label: "iPhone 15 Plus", color: "#60a5fa" },
  { key: "iphone15Pro", generation: "iphone15", type: "pro", label: "iPhone 15 Pro", color: "#2563eb" },
  { key: "iphone15ProMax", generation: "iphone15", type: "proMax", label: "iPhone 15 Pro Max", color: "#1e3a8a" },
  { key: "iphone16Basic", generation: "iphone16", type: "basic", label: "iPhone 16 Basic", color: "#99f6e4" },
  { key: "iphone16Plus", generation: "iphone16", type: "plusAir", label: "iPhone 16 Plus", color: "#5eead4" },
  { key: "iphone16Pro", generation: "iphone16", type: "pro", label: "iPhone 16 Pro", color: "#0d9488" },
  { key: "iphone16ProMax", generation: "iphone16", type: "proMax", label: "iPhone 16 Pro Max", color: "#134e4a" },
  { key: "iphone16E", generation: "iphone16", type: "e", label: "iPhone 16e", color: "#059669" },
  { key: "iphone17Basic", generation: "iphone17", type: "basic", label: "iPhone 17 Basic", color: "#fde68a" },
  { key: "iphone17Air", generation: "iphone17", type: "plusAir", label: "iPhone 17 Air", color: "#fbbf24" },
  { key: "iphone17Pro", generation: "iphone17", type: "pro", label: "iPhone 17 Pro", color: "#d97706" },
  { key: "iphone17ProMax", generation: "iphone17", type: "proMax", label: "iPhone 17 Pro Max", color: "#78350f" },
  { key: "iphone17E", generation: "iphone17", type: "e", label: "iPhone 17e", color: "#16a34a" },
  { key: "iphone18Basic", generation: "iphone18", type: "basic", label: "iPhone 18 Basic", color: "#ddd6fe" },
  { key: "iphone18Air", generation: "iphone18", type: "plusAir", label: "iPhone 18 Air", color: "#a78bfa" },
  { key: "iphone18Pro", generation: "iphone18", type: "pro", label: "iPhone 18 Pro", color: "#7c3aed" },
  { key: "iphone18ProMax", generation: "iphone18", type: "proMax", label: "iPhone 18 Pro Max", color: "#4c1d95" },
  { key: "iphone18E", generation: "iphone18", type: "e", label: "iPhone 18e", color: "#16a34a" },
  { key: "iphone18Foldable", generation: "iphone18", type: "foldable", label: "iPhone 18 Foldable", color: "#e11d48" },
]

const emptyModelValues = Object.fromEntries(
  aniModels.map((model) => [model.key, 0]),
) as AniModelValues

function makeQuarter(
  quarter: string,
  values: Partial<AniModelValues>,
): AniQuarterlyProduction {
  return { quarter, ...emptyModelValues, ...values }
}

export const aniQuarterlyProduction: readonly AniQuarterlyProduction[] = [
  makeQuarter("2024 Q1", {
    iphone15Basic: 44,
    iphone15Plus: 21,
    iphone15Pro: 36,
    iphone15ProMax: 31,
  }),
  makeQuarter("2024 Q2", {
    iphone15Basic: 42,
    iphone15Plus: 20,
    iphone15Pro: 34,
    iphone15ProMax: 29,
  }),
  makeQuarter("2024 Q3", {
    iphone15Basic: 40,
    iphone15Plus: 19,
    iphone15Pro: 32,
    iphone15ProMax: 27,
    iphone16Basic: 39,
    iphone16Plus: 18,
    iphone16Pro: 33,
    iphone16ProMax: 28,
  }),
  makeQuarter("2024 Q4", {
    iphone15Basic: 38,
    iphone15Plus: 18,
    iphone15Pro: 30,
    iphone15ProMax: 26,
    iphone16Basic: 55,
    iphone16Plus: 24,
    iphone16Pro: 46,
    iphone16ProMax: 37,
  }),
  makeQuarter("2025 Q1", {
    iphone15Basic: 34,
    iphone15Plus: 16,
    iphone15Pro: 27,
    iphone15ProMax: 23,
    iphone16Basic: 53,
    iphone16Plus: 23,
    iphone16Pro: 45,
    iphone16ProMax: 36,
  }),
  makeQuarter("2025 Q2", {
    iphone15Basic: 31,
    iphone15Plus: 15,
    iphone15Pro: 25,
    iphone15ProMax: 21,
    iphone16Basic: 50,
    iphone16Plus: 22,
    iphone16Pro: 42,
    iphone16ProMax: 34,
    iphone16E: 13,
  }),
  makeQuarter("2025 Q3", {
    iphone15Basic: 28,
    iphone15Plus: 13,
    iphone15Pro: 22,
    iphone15ProMax: 19,
    iphone16Basic: 45,
    iphone16Plus: 20,
    iphone16Pro: 38,
    iphone16ProMax: 31,
    iphone16E: 14,
    iphone17Basic: 46,
    iphone17Air: 17,
    iphone17Pro: 35,
    iphone17ProMax: 29,
  }),
  makeQuarter("2025 Q4", {
    iphone15Basic: 25,
    iphone15Plus: 12,
    iphone15Pro: 20,
    iphone15ProMax: 17,
    iphone16Basic: 42,
    iphone16Plus: 18,
    iphone16Pro: 35,
    iphone16ProMax: 29,
    iphone16E: 16,
    iphone17Basic: 56,
    iphone17Air: 21,
    iphone17Pro: 44,
    iphone17ProMax: 37,
  }),
  makeQuarter("2026 Q1", {
    iphone15Basic: 22,
    iphone15Plus: 10,
    iphone15Pro: 18,
    iphone15ProMax: 15,
    iphone16Basic: 38,
    iphone16Plus: 16,
    iphone16Pro: 32,
    iphone16ProMax: 26,
    iphone16E: 18,
    iphone17Basic: 55,
    iphone17Air: 20,
    iphone17Pro: 46,
    iphone17ProMax: 39,
    iphone17E: 10,
  }),
  makeQuarter("2026 Q2", {
    iphone15Basic: 19,
    iphone15Plus: 9,
    iphone15Pro: 16,
    iphone15ProMax: 13,
    iphone16Basic: 35,
    iphone16Plus: 15,
    iphone16Pro: 29,
    iphone16ProMax: 24,
    iphone16E: 20,
    iphone17Basic: 58,
    iphone17Air: 22,
    iphone17Pro: 49,
    iphone17ProMax: 42,
    iphone17E: 13,
  }),
  makeQuarter("2026 Q3", {
    iphone15Basic: 16,
    iphone15Plus: 8,
    iphone15Pro: 14,
    iphone15ProMax: 11,
    iphone16Basic: 32,
    iphone16Plus: 13,
    iphone16Pro: 27,
    iphone16ProMax: 22,
    iphone16E: 20,
    iphone17Basic: 60,
    iphone17Air: 23,
    iphone17Pro: 52,
    iphone17ProMax: 45,
    iphone17E: 16,
    iphone18Basic: 36,
    iphone18Air: 13,
    iphone18Pro: 30,
    iphone18ProMax: 25,
  }),
  makeQuarter("2026 Q4", {
    iphone15Basic: 13,
    iphone15Plus: 6,
    iphone15Pro: 11,
    iphone15ProMax: 9,
    iphone16Basic: 29,
    iphone16Plus: 12,
    iphone16Pro: 24,
    iphone16ProMax: 20,
    iphone16E: 18,
    iphone17Basic: 58,
    iphone17Air: 22,
    iphone17Pro: 50,
    iphone17ProMax: 44,
    iphone17E: 18,
    iphone18Basic: 52,
    iphone18Air: 18,
    iphone18Pro: 43,
    iphone18ProMax: 36,
  }),
  makeQuarter("2027 Q1", {
    iphone15Basic: 10,
    iphone15Plus: 5,
    iphone15Pro: 8,
    iphone15ProMax: 7,
    iphone16Basic: 26,
    iphone16Plus: 11,
    iphone16Pro: 22,
    iphone16ProMax: 18,
    iphone16E: 16,
    iphone17Basic: 55,
    iphone17Air: 21,
    iphone17Pro: 47,
    iphone17ProMax: 42,
    iphone17E: 17,
    iphone18Basic: 61,
    iphone18Air: 23,
    iphone18Pro: 53,
    iphone18ProMax: 46,
    iphone18E: 15,
    iphone18Foldable: 8,
  }),
  makeQuarter("2027 Q2", {
    iphone15Basic: 8,
    iphone15Plus: 4,
    iphone15Pro: 6,
    iphone15ProMax: 5,
    iphone16Basic: 23,
    iphone16Plus: 10,
    iphone16Pro: 19,
    iphone16ProMax: 16,
    iphone16E: 14,
    iphone17Basic: 52,
    iphone17Air: 20,
    iphone17Pro: 45,
    iphone17ProMax: 40,
    iphone17E: 16,
    iphone18Basic: 70,
    iphone18Air: 27,
    iphone18Pro: 61,
    iphone18ProMax: 54,
    iphone18E: 18,
    iphone18Foldable: 14,
  }),
]

export const aniFocusQuarter = "2027 Q2" as const

export function getAniVisibleModelKeys(
  generations: readonly AniGenerationKey[],
  types: readonly AniModelTypeKey[],
): AniModelKey[] {
  return aniModels
    .filter(
      (model) =>
        generations.includes(model.generation) && types.includes(model.type),
    )
    .map((model) => model.key)
}

const aniModelKeys = aniModels.map((model) => model.key)

export function getAniProductionTotal(
  item: AniModelValues,
  visibleModelKeys: readonly AniModelKey[] = aniModelKeys,
): number {
  return visibleModelKeys.reduce((total, modelKey) => total + item[modelKey], 0)
}

export const aniProductionYAxisDomain = [
  0,
  Math.ceil(
    Math.max(...aniQuarterlyProduction.map((item) => getAniProductionTotal(item))) /
      100,
  ) * 100,
] as const

const revisionFactors = [0.91, 0.93, 0.95, 0.97, 0.985, 1] as const

function getAniHistoryPeriods(quarter: string): string[] {
  const [year, quarterLabel] = quarter.split(" ")
  const lastRevisionMonth = Number(quarterLabel.slice(1)) * 3 - 1

  return revisionFactors.map((_, index) => {
    const date = new Date(
      Date.UTC(Number(year), lastRevisionMonth - 1 - (5 - index), 1),
    )
    const shortYear = String(date.getUTCFullYear()).slice(-2)
    const month = String(date.getUTCMonth() + 1).padStart(2, "0")
    return `${shortYear}-${month}월`
  })
}

export function getAniForecastHistory(
  quarter: string,
): readonly AniForecastHistoryPoint[] {
  const current =
    aniQuarterlyProduction.find((item) => item.quarter === quarter) ??
    aniQuarterlyProduction[0]
  const historyPeriods = getAniHistoryPeriods(current.quarter)

  return revisionFactors.map((factor, periodIndex) => {
    const point = {
      quarter: current.quarter,
      period: historyPeriods[periodIndex],
    } as AniForecastHistoryPoint

    aniModels.forEach((model, modelIndex) => {
      const modelAdjustment =
        (modelIndex - 9) * 0.002 * (revisionFactors.length - 1 - periodIndex)
      point[model.key] = Number(
        (current[model.key] * (factor + modelAdjustment)).toFixed(1),
      )
    })

    return point
  })
}

export function getAniHistorySummary(
  history: readonly AniForecastHistoryPoint[],
  visibleModelKeys: readonly AniModelKey[],
): AniHistorySummary {
  const current = getAniProductionTotal(history.at(-1)!, visibleModelKeys)
  const previous = getAniProductionTotal(history.at(-2)!, visibleModelKeys)
  const first = getAniProductionTotal(history[0], visibleModelKeys)

  return {
    currentTotal: Number(current.toFixed(1)),
    monthOverMonth: Number((current - previous).toFixed(1)),
    sixMonth: Number((current - first).toFixed(1)),
  }
}
