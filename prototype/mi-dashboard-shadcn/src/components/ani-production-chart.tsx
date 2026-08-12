import { useMemo, useState } from "react"
import { MousePointerClick } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  aniFocusQuarter,
  aniModels,
  aniQuarterlyProduction,
  getAniForecastHistory,
  getAniHistorySummary,
  getAniProductionTotal,
  getAniVisibleModelKeys,
  getAniVisibleModelKeysForLineup,
  type AniFilterMode,
  type AniGenerationKey,
  type AniLineupBucketKey,
  type AniModelKey,
  type AniModelTypeKey,
} from "@/data/ani"
import { getTotalLabelOffsets } from "@/lib/chart-labels"

const generationOptions = [
  { key: "iphone15", label: "iPhone 15" },
  { key: "iphone16", label: "iPhone 16" },
  { key: "iphone17", label: "iPhone 17" },
  { key: "iphone18", label: "iPhone 18" },
] as const satisfies readonly {
  key: AniGenerationKey
  label: string
}[]

const modelTypeOptions = [
  { key: "basic", label: "Basic" },
  { key: "plusAir", label: "Plus / Air" },
  { key: "pro", label: "Pro" },
  { key: "proMax", label: "Pro Max" },
  { key: "e", label: "e" },
  { key: "foldable", label: "Foldable" },
] as const satisfies readonly {
  key: AniModelTypeKey
  label: string
}[]

const lineupOptions = [
  { key: "n", label: "N" },
  { key: "nPlus1", label: "N+1" },
  { key: "nPlus2", label: "N+2" },
  { key: "legacy", label: "Legacy" },
] as const satisfies readonly {
  key: AniLineupBucketKey
  label: string
}[]

const generationLegendTypes = [
  "basic",
  "plusAir",
  "pro",
  "proMax",
  "e",
  "foldable",
] as const
const specialLegendTypes = ["e", "foldable"] as const

type AniSpecialLegendType = (typeof specialLegendTypes)[number]

function getAniPatternImage(
  type: AniSpecialLegendType,
  patternColor: string,
) {
  return type === "e"
    ? `repeating-linear-gradient(135deg, transparent 0 2px, ${patternColor} 2px 3px)`
    : `radial-gradient(circle, ${patternColor} 1px, transparent 1.5px)`
}

function getAniLegendSwatchStyle(model: (typeof aniModels)[number]) {
  if (model.type === "e" || model.type === "foldable") {
    return {
      backgroundColor: model.color,
      backgroundImage: getAniPatternImage(model.type, "rgba(255,255,255,.78)"),
      backgroundSize: "6px 6px",
    }
  }

  return { backgroundColor: model.color }
}

function getAniNeutralPatternStyle(type: AniSpecialLegendType) {
  return {
    backgroundColor: "var(--muted-foreground)",
    backgroundImage: getAniPatternImage(type, "var(--background)"),
    backgroundSize: "6px 6px",
  }
}

const aniChartConfig = Object.fromEntries(
  aniModels.map((model) => [
    model.key,
    { label: model.label, color: model.color },
  ]),
) satisfies ChartConfig

type AniLabelProps = {
  value?: unknown
  x?: unknown
  y?: unknown
  width?: unknown
  height?: unknown
  fill?: string
}

type AniChartItem = {
  quarter: string
  period?: string
  visibleTotal: number
  totalLabel?: string
  topVisibleModelKey?: AniModelKey
} & Record<AniModelKey, number>

function renderAniSegmentLabel(props: AniLabelProps) {
  const value = Number(props.value)
  const width = Number(props.width)
  const x = Number(props.x)
  const y = Number(props.y)
  const height = Number(props.height)

  if (
    !Number.isFinite(value) ||
    value === 0 ||
    !Number.isFinite(height) ||
    height < 12
  ) {
    return ""
  }

  return (
    <text
      className="type-chart-segment-value"
      dominantBaseline="middle"
      fill={props.fill ?? "var(--foreground)"}
      fontSize={10}
      fontWeight={600}
      textAnchor="middle"
      x={x + width / 2}
      y={y + height / 2}
    >
      {value.toFixed(1)}
    </text>
  )
}

type AniQuarterTickProps = {
  x?: number
  y?: number
  payload?: { value?: unknown }
  selectedQuarter?: string
}

function AniQuarterTick({
  payload,
  selectedQuarter,
  x,
  y,
}: AniQuarterTickProps) {
  const quarter = String(payload?.value ?? "")
  const isSelected = quarter === selectedQuarter

  return (
    <g
      aria-label={`${quarter}${isSelected ? " selected" : ""}`}
      role="text"
      transform={`translate(${x ?? 0},${y ?? 0})`}
    >
      <text
        className="type-chart-axis"
        dy={9}
        fill={isSelected ? "var(--primary)" : "var(--muted-foreground)"}
        fontSize={10}
        fontWeight={400}
        textAnchor="middle"
      >
        {quarter}
      </text>
      {isSelected ? (
        <line
          stroke="var(--primary)"
          strokeWidth={2}
          x1={-18}
          x2={18}
          y1={12}
          y2={12}
        />
      ) : null}
    </g>
  )
}

function AniPatternDefs({ prefix }: { prefix: string }) {
  return (
    <defs>
      {aniModels
        .filter((model) => model.type === "e" || model.type === "foldable")
        .map((model) => (
          <pattern
            height="8"
            id={`${prefix}-${model.key}`}
            key={model.key}
            patternUnits="userSpaceOnUse"
            width="8"
          >
            <rect
              fill={model.color}
              fillOpacity={0.22}
              height="8"
              width="8"
            />
            {model.type === "e" ? (
              <path
                d="M-2 2L2 -2M0 8L8 0M6 10L10 6"
                stroke={model.color}
                strokeWidth={1.5}
              />
            ) : (
              <circle cx="2" cy="2" fill={model.color} r="1.5" />
            )}
          </pattern>
        ))}
    </defs>
  )
}

function getAniBarFill(
  model: (typeof aniModels)[number],
  prefix: string,
) {
  return model.type === "e" || model.type === "foldable"
    ? `url(#${prefix}-${model.key})`
    : model.color
}

function renderAniTotalLabel(props: AniLabelProps) {
  const [value, offset] = String(props.value).split("|").map(Number)
  const x = Number(props.x)
  const y = Number(props.y)
  const width = Number(props.width)

  if (
    props.value === "" ||
    !Number.isFinite(value) ||
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(width)
  ) {
    return ""
  }

  return (
    <text
      className="type-chart-total"
      fill="var(--foreground)"
      fontSize={11}
      fontWeight={600}
      textAnchor="middle"
      x={x + width / 2}
      y={y - 6 + offset}
    >
      {formatMu(value)}
    </text>
  )
}

function maskAniChartItem(
  item: {
    quarter: string
    period?: string
  } & Record<AniModelKey, number>,
  visibleModelKeys: readonly AniModelKey[],
): AniChartItem {
  const visibleModelKeySet = new Set(visibleModelKeys)
  const chartItem = {
    ...item,
    visibleTotal: getAniProductionTotal(item, visibleModelKeys),
    topVisibleModelKey:
      [...visibleModelKeys].reverse().find((modelKey) => item[modelKey] > 0) ??
      visibleModelKeys.at(-1),
  } as AniChartItem

  aniModels.forEach((model) => {
    chartItem[model.key] = visibleModelKeySet.has(model.key)
      ? item[model.key]
      : 0
  })

  return chartItem
}

function formatMu(value: number) {
  return `${value.toFixed(1)}Mu`
}

function formatSignedMu(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}Mu`
}

function getDeltaClassName(value: number) {
  return value > 0
    ? "text-primary"
    : value < 0
      ? "text-destructive"
      : "text-muted-foreground"
}

function getLabelColor(modelType: AniModelTypeKey) {
  return modelType === "basic" || modelType === "plusAir"
    ? "var(--foreground)"
    : "var(--primary-foreground)"
}

export function AniProductionChart() {
  const [filterMode, setFilterMode] = useState<AniFilterMode>("lineup")
  const [selectedLineupBuckets, setSelectedLineupBuckets] = useState<
    Set<AniLineupBucketKey>
  >(() => new Set(lineupOptions.map(({ key }) => key)))
  const [selectedGenerations, setSelectedGenerations] = useState<
    Set<AniGenerationKey>
  >(() => new Set(generationOptions.map(({ key }) => key)))
  const [selectedTypes, setSelectedTypes] = useState<Set<AniModelTypeKey>>(
    () => new Set(modelTypeOptions.map(({ key }) => key)),
  )
  const [selectedQuarter, setSelectedQuarter] = useState<string>(aniFocusQuarter)
  const [hoveredQuarter, setHoveredQuarter] = useState<string | null>(null)

  const activeGenerations = generationOptions
    .map(({ key }) => key)
    .filter((key) => selectedGenerations.has(key))
  const activeLineupBuckets = lineupOptions
    .map(({ key }) => key)
    .filter((key) => selectedLineupBuckets.has(key))
  const activeTypes = modelTypeOptions
    .map(({ key }) => key)
    .filter((key) => selectedTypes.has(key))
  const getVisibleModelKeysForQuarter = (quarter: string) =>
    filterMode === "lineup"
      ? getAniVisibleModelKeysForLineup(
          quarter,
          activeLineupBuckets,
          activeTypes,
        )
      : getAniVisibleModelKeys(activeGenerations, activeTypes)
  const quarterlyVisibleModelKeys = aniQuarterlyProduction.map((item) =>
    getVisibleModelKeysForQuarter(item.quarter),
  )
  const productionRows = aniQuarterlyProduction.map(
    (item, index) => maskAniChartItem(item, quarterlyVisibleModelKeys[index]),
  )
  const history = useMemo(
    () => getAniForecastHistory(selectedQuarter),
    [selectedQuarter],
  )
  const historyVisibleModelKeys = getVisibleModelKeysForQuarter(selectedQuarter)
  const historyRows = history.map((item) =>
    maskAniChartItem(item, historyVisibleModelKeys),
  )
  const chartModelKeys = Array.from(
    new Set([
      ...quarterlyVisibleModelKeys.flat(),
      ...historyVisibleModelKeys,
    ]),
  )
  const visibleModels = aniModels.filter((model) =>
    chartModelKeys.includes(model.key),
  )
  const maxVisibleTotal = Math.max(
    0,
    ...productionRows.map((item) => item.visibleTotal),
    ...historyRows.map((item) => item.visibleTotal),
  )
  const upperBound = Math.max(10, Math.ceil((maxVisibleTotal * 1.08) / 10) * 10)
  const visibleYAxisDomain = [0, upperBound] as const
  const productionLabelOffsets = getTotalLabelOffsets(
    productionRows.map((item) => item.visibleTotal),
    330,
    upperBound,
  )
  const historyLabelOffsets = getTotalLabelOffsets(
    historyRows.map((item) => item.visibleTotal),
    330,
    upperBound,
  )
  const productionWithVisibleTotals = productionRows.map((item, index) => ({
    ...item,
    totalLabel: `${item.visibleTotal}|${productionLabelOffsets[index]}`,
  }))
  const historyWithVisibleTotals = historyRows.map((item, index) => ({
    ...item,
    totalLabel: `${item.visibleTotal}|${historyLabelOffsets[index]}`,
  }))
  const summary = getAniHistorySummary(history, historyVisibleModelKeys)

  const toggleLineupBucket = (bucket: AniLineupBucketKey) => {
    setSelectedLineupBuckets((current) => {
      const next = new Set(current)
      if (next.has(bucket)) {
        if (next.size > 1) {
          next.delete(bucket)
        }
      } else {
        next.add(bucket)
      }
      return next
    })
  }

  const toggleGeneration = (generation: AniGenerationKey) => {
    setSelectedGenerations((current) => {
      const next = new Set(current)
      if (next.has(generation)) {
        if (next.size > 1) {
          next.delete(generation)
        }
      } else {
        next.add(generation)
      }
      return next
    })
  }

  const toggleType = (type: AniModelTypeKey) => {
    setSelectedTypes((current) => {
      const next = new Set(current)
      if (next.has(type)) {
        if (next.size > 1) {
          next.delete(type)
        }
      } else {
        next.add(type)
      }
      return next
    })
  }

  return (
    <Card className="min-w-0 border-border shadow-none" size="sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 border-b pb-3">
        <div>
          <p className="type-eyebrow text-muted-foreground">
            ANI Production
          </p>
          <CardTitle className="type-card-title mt-1 tracking-tight">
            분기별 모델 생산량
          </CardTitle>
        </div>
        <Button
          className="type-control shrink-0"
          onPress={() => {
            setFilterMode("lineup")
            setSelectedLineupBuckets(new Set(lineupOptions.map(({ key }) => key)))
            setSelectedGenerations(new Set(generationOptions.map(({ key }) => key)))
            setSelectedTypes(new Set(modelTypeOptions.map(({ key }) => key)))
          }}
          size="sm"
          variant="outline"
        >
          필터 초기화
        </Button>
      </CardHeader>
      <CardContent className="pt-3">
        <div className="mb-3 grid min-w-0 gap-2">
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
            <ToggleGroup
              aria-label="필터 기준"
              onSelectionChange={(selection) => {
                const next = Array.from(selection)[0]
                if (next === "lineup" || next === "series") {
                  setFilterMode(next)
                }
              }}
              selectedKeys={new Set([filterMode])}
              selectionMode="single"
              size="sm"
              variant="outline"
            >
              <ToggleGroupItem id="lineup">라인업 기준</ToggleGroupItem>
              <ToggleGroupItem id="series">시리즈 기준</ToggleGroupItem>
            </ToggleGroup>
            <p className="type-control pt-1 text-right text-muted-foreground">
              {aniModels.length}개 중 {visibleModels.length}개 모델 표시
            </p>
          </div>
          {filterMode === "lineup" ? (
            <div
              aria-label="라인업 필터"
              className="flex flex-wrap gap-2"
              role="group"
            >
              <span className="type-control-label w-16 pt-1 text-muted-foreground">
                라인업
              </span>
              <div className="flex flex-wrap gap-2">
                {lineupOptions.map(({ key, label }) => {
                  const isSelected = selectedLineupBuckets.has(key)

                  return (
                    <Button
                      aria-pressed={isSelected}
                      className="type-control h-7 px-2"
                      key={key}
                      onPress={() => toggleLineupBucket(key)}
                      size="sm"
                      variant={isSelected ? "secondary" : "outline"}
                    >
                      {label}
                    </Button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div
              aria-label="시리즈 필터"
              className="flex flex-wrap gap-2"
              role="group"
            >
              <span className="type-control-label w-16 pt-1 text-muted-foreground">
                시리즈
              </span>
              <div className="flex flex-wrap gap-2">
                {generationOptions.map(({ key, label }) => {
                  const isSelected = selectedGenerations.has(key)

                  return (
                    <Button
                      aria-pressed={isSelected}
                      className="type-control h-7 px-2"
                      key={key}
                      onPress={() => toggleGeneration(key)}
                      size="sm"
                      variant={isSelected ? "secondary" : "outline"}
                    >
                      {label}
                    </Button>
                  )
                })}
              </div>
            </div>
          )}
          <div
            aria-label="모델 유형"
            className="flex flex-wrap gap-2"
            role="group"
          >
            <span className="type-control-label w-16 pt-1 text-muted-foreground">
              모델 유형
            </span>
            <div className="flex flex-wrap gap-2">
              {modelTypeOptions.map(({ key, label }) => {
                const isSelected = selectedTypes.has(key)

                return (
                  <Button
                    aria-pressed={isSelected}
                    className="type-control h-7 gap-1.5 px-2"
                    key={key}
                    onPress={() => toggleType(key)}
                    size="sm"
                    variant={isSelected ? "secondary" : "outline"}
                  >
                    <span
                      aria-hidden="true"
                      className="size-2"
                      style={
                        key === "e" || key === "foldable"
                          ? getAniNeutralPatternStyle(key)
                          : {
                              backgroundColor:
                                aniModels.find((model) => model.type === key)
                                  ?.color,
                            }
                      }
                    />
                    {label}
                  </Button>
                )
              })}
            </div>
          </div>
          <div
            aria-label="시리즈 색상 범례"
            className="type-control flex min-w-0 flex-wrap items-center gap-2 border-t pt-2 text-muted-foreground"
          >
            {generationOptions.map(({ key, label }) => (
              <span
                className="type-control inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-border bg-secondary px-2 text-secondary-foreground"
                key={key}
              >
                <span>{label}</span>
                <span className="flex items-center gap-0.5" aria-hidden="true">
                  {generationLegendTypes.map((type) => {
                    const model = aniModels.find(
                      (item) => item.generation === key && item.type === type,
                    )
                    return model ? (
                      <i
                        className="size-2.5"
                        key={model.key}
                        style={getAniLegendSwatchStyle(model)}
                        title={model.label}
                      />
                    ) : null
                  })}
                </span>
              </span>
            ))}
            {specialLegendTypes.map((type) => (
              <span
                className="type-control inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-border bg-secondary px-2 text-secondary-foreground"
                key={`pattern-key-${type}`}
              >
                <i
                  aria-hidden="true"
                  className="size-2.5"
                  style={getAniNeutralPatternStyle(type)}
                />
                {type === "e" ? "사선 · e" : "점 · Foldable"}
              </span>
            ))}
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-[minmax(0,58fr)_minmax(0,42fr)] gap-0 border-t pt-3">
          <section
            aria-labelledby="ani-quarterly-chart-title"
            className="min-w-0 pe-6"
          >
            <div className="mb-2 flex h-11 items-center justify-between gap-4">
              <div>
                <p id="ani-quarterly-chart-title" className="type-section-title">
                  모델별 분기 생산량
                </p>
                <p aria-live="polite" className="type-control mt-1 text-muted-foreground">
                  {selectedQuarter} 선택됨 · {visibleModels.length}개 모델
                  {" · "}신규: e '25 Q2 / Foldable '27 Q1
                </p>
              </div>
              <p className="type-control-label flex items-center gap-1.5 text-primary">
                <MousePointerClick aria-hidden="true" className="size-3.5" />
                막대를 클릭해 전망 변화 확인
              </p>
            </div>
            <ChartContainer
              aria-label="ANI quarterly model production"
              className="h-[330px] w-full min-w-0"
              config={aniChartConfig}
            >
              <BarChart
                accessibilityLayer
                barCategoryGap="8%"
                data={productionWithVisibleTotals}
                margin={{ top: 26, right: 8, left: 10, bottom: 4 }}
                onClick={({ activeLabel }) => {
                  if (typeof activeLabel === "string") {
                    setSelectedQuarter(activeLabel)
                  }
                }}
                onMouseLeave={() => setHoveredQuarter(null)}
                onMouseMove={({ activeLabel }) => {
                  setHoveredQuarter(
                    typeof activeLabel === "string" ? activeLabel : null,
                  )
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <AniPatternDefs prefix="ani-quarterly" />
                <XAxis
                  axisLine={false}
                  dataKey="quarter"
                  fontSize={10}
                  interval={0}
                  tickLine={false}
                  tickMargin={6}
                  tick={<AniQuarterTick selectedQuarter={selectedQuarter} />}
                />
                <YAxis
                  axisLine={false}
                  domain={visibleYAxisDomain}
                  tickFormatter={(value) => `${value}m`}
                  tickLine={false}
                  tickMargin={8}
                  width={48}
                />
                <ChartTooltip
                  content={(props) => (
                    <ChartTooltipContent
                      {...props}
                      content={undefined}
                      payload={props.payload?.filter(
                        ({ value }) => Number(value) !== 0,
                      )}
                    />
                  )}
                  cursor={false}
                />
                {getVisibleModelKeysForQuarter("2025 Q2").includes("iphone16E") ? (
                  <ReferenceLine
                    stroke="var(--muted-foreground)"
                    strokeDasharray="3 3"
                    x="2025 Q2"
                  />
                ) : null}
                {getVisibleModelKeysForQuarter("2027 Q1").includes("iphone18Foldable") ? (
                  <ReferenceLine
                    stroke="var(--muted-foreground)"
                    strokeDasharray="3 3"
                    x="2027 Q1"
                  />
                ) : null}
                {aniModels.map((model) => (
                  <Bar
                    dataKey={model.key}
                    fill={getAniBarFill(model, "ani-quarterly")}
                    isAnimationActive={false}
                    key={model.key}
                    stackId="ani-production"
                  >
                    {productionWithVisibleTotals.map((item) => (
                      <Cell
                        className="cursor-pointer transition-opacity focus:outline-none focus-visible:outline-none"
                        fillOpacity={
                          hoveredQuarter && hoveredQuarter !== item.quarter
                            ? 0.25
                            : 1
                        }
                        key={`${model.key}-${item.quarter}`}
                      />
                    ))}
                    <LabelList
                      content={renderAniSegmentLabel}
                      dataKey={model.key}
                      fill={getLabelColor(model.type)}
                      position="center"
                    />
                    <LabelList
                      content={renderAniTotalLabel}
                      valueAccessor={(entry) =>
                        entry.payload.topVisibleModelKey === model.key
                          ? entry.payload.totalLabel
                          : ""
                      }
                      position="top"
                    />
                  </Bar>
                ))}
              </BarChart>
            </ChartContainer>
          </section>

          <aside className="min-w-0 border-s ps-6" aria-labelledby="ani-history-title">
            <div className="mb-2 h-11">
              <p className="type-eyebrow text-primary">
                Forecast History
              </p>
              <h3 id="ani-history-title" className="type-section-title mt-1">
                {selectedQuarter} 전망 변화
              </h3>
            </div>
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_150px] gap-2">
              <ChartContainer
                aria-label={`${selectedQuarter} six-month forecast history`}
                className="h-[330px] w-full min-w-0"
                config={aniChartConfig}
              >
                <BarChart
                  accessibilityLayer
                  barCategoryGap="8%"
                  data={historyWithVisibleTotals}
                  margin={{ top: 26, right: 2, left: 0, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <AniPatternDefs prefix="ani-history" />
                  <XAxis
                    axisLine={false}
                    dataKey="period"
                    fontSize={10}
                    interval={0}
                    tickLine={false}
                    tickMargin={6}
                  />
                  <YAxis domain={visibleYAxisDomain} hide />
                  <ChartTooltip
                    content={(props) => (
                      <ChartTooltipContent
                        {...props}
                        content={undefined}
                        payload={props.payload?.filter(
                          ({ value }) => Number(value) !== 0,
                        )}
                      />
                    )}
                    cursor={false}
                  />
                  {aniModels.map((model) => (
                    <Bar
                      dataKey={model.key}
                      fill={getAniBarFill(model, "ani-history")}
                      isAnimationActive={false}
                      key={model.key}
                      stackId="ani-history"
                    >
                      <LabelList
                        content={renderAniSegmentLabel}
                        dataKey={model.key}
                        fill={getLabelColor(model.type)}
                        position="center"
                      />
                      <LabelList
                        content={renderAniTotalLabel}
                        valueAccessor={(entry) =>
                          entry.payload.topVisibleModelKey === model.key
                            ? entry.payload.totalLabel
                            : ""
                        }
                        position="top"
                      />
                    </Bar>
                  ))}
                </BarChart>
              </ChartContainer>
              <dl className="type-table-body pt-5">
                <div className="mb-3 border-b pb-2">
                  <dt className="type-control text-muted-foreground">현재 Forecast</dt>
                  <dd className="type-control-label mt-1 tabular-nums">
                    {formatMu(summary.currentTotal)}
                  </dd>
                </div>
                <div className="mb-3 border-b pb-2">
                  <dt className="type-control text-muted-foreground">전월 대비</dt>
                  <dd
                    className={`type-control-label mt-1 tabular-nums ${getDeltaClassName(summary.monthOverMonth)}`}
                  >
                    {formatSignedMu(summary.monthOverMonth)}
                  </dd>
                </div>
                <div>
                  <dt className="type-control text-muted-foreground">6개월 대비</dt>
                  <dd
                    className={`type-control-label mt-1 tabular-nums ${getDeltaClassName(summary.sixMonth)}`}
                  >
                    {formatSignedMu(summary.sixMonth)}
                  </dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </CardContent>
    </Card>
  )
}
