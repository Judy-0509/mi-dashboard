import { useMemo, useState } from "react"
import { MousePointerClick } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
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
import {
  aniFocusQuarter,
  aniModels,
  aniQuarterlyProduction,
  getAniForecastHistory,
  getAniHistorySummary,
  getAniProductionTotal,
  getAniVisibleModelKeys,
  type AniGenerationKey,
  type AniModelTypeKey,
} from "@/data/ani"

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
    height < 24
  ) {
    return ""
  }

  return (
    <text
      dominantBaseline="middle"
      fill={props.fill ?? "var(--foreground)"}
      fontSize={9}
      fontWeight={600}
      textAnchor="middle"
      x={x + width / 2}
      y={y + height / 2}
    >
      {value.toFixed(1)}
    </text>
  )
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
  const activeTypes = modelTypeOptions
    .map(({ key }) => key)
    .filter((key) => selectedTypes.has(key))
  const visibleModelKeys = useMemo(
    () => getAniVisibleModelKeys(activeGenerations, activeTypes),
    [activeGenerations, activeTypes],
  )
  const visibleModels = aniModels.filter((model) =>
    visibleModelKeys.includes(model.key),
  )
  const topVisibleModelKey = visibleModelKeys.at(-1)
  const productionWithVisibleTotals = aniQuarterlyProduction.map((item) => ({
    ...item,
    visibleTotal: getAniProductionTotal(item, visibleModelKeys),
  }))
  const history = useMemo(
    () => getAniForecastHistory(selectedQuarter),
    [selectedQuarter],
  )
  const historyWithVisibleTotals = history.map((item) => ({
    ...item,
    visibleTotal: getAniProductionTotal(item, visibleModelKeys),
  }))
  const visibleYAxisDomain = useMemo(() => {
    const maxVisibleTotal = Math.max(
      0,
      ...productionWithVisibleTotals.map((item) => item.visibleTotal),
      ...historyWithVisibleTotals.map((item) => item.visibleTotal),
    )
    const upperBound = Math.max(10, Math.ceil((maxVisibleTotal * 1.08) / 10) * 10)

    return [0, upperBound] as const
  }, [historyWithVisibleTotals, productionWithVisibleTotals])
  const summary = getAniHistorySummary(history, visibleModelKeys)

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
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            ANI Production
          </p>
          <CardTitle className="mt-1 text-xl font-semibold tracking-tight group-data-[size=sm]/card:text-xl">
            분기별 모델 생산량
          </CardTitle>
        </div>
        <Button
          className="shrink-0"
          onPress={() => {
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
        <div className="mb-3 flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="grid min-w-0 gap-2">
            <div aria-label="시리즈" className="flex flex-wrap gap-2" role="group">
              <span className="w-16 pt-1 text-xs font-medium text-muted-foreground">
                시리즈
              </span>
              <div className="flex flex-wrap gap-2">
                {generationOptions.map(({ key, label }) => {
                  const isSelected = selectedGenerations.has(key)

                  return (
                    <Button
                      aria-pressed={isSelected}
                      className="h-7 px-2 text-xs"
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
            <div
              aria-label="모델 유형"
              className="flex flex-wrap gap-2"
              role="group"
            >
              <span className="w-16 pt-1 text-xs font-medium text-muted-foreground">
                모델 유형
              </span>
              <div className="flex flex-wrap gap-2">
                {modelTypeOptions.map(({ key, label }) => {
                  const isSelected = selectedTypes.has(key)

                  return (
                    <Button
                      aria-pressed={isSelected}
                      className="h-7 gap-1.5 px-2 text-xs"
                      key={key}
                      onPress={() => toggleType(key)}
                      size="sm"
                      variant={isSelected ? "secondary" : "outline"}
                    >
                      <span
                        aria-hidden="true"
                        className="size-2"
                        style={{
                          backgroundColor:
                            aniModels.find((model) => model.type === key)
                              ?.color,
                        }}
                      />
                      {label}
                    </Button>
                  )
                })}
              </div>
            </div>
          </div>
          <p className="pt-1 text-right text-xs leading-5 text-muted-foreground">
            {aniModels.length}개 중 {visibleModels.length}개 모델 표시
          </p>
        </div>

        <div className="grid min-w-0 grid-cols-[minmax(0,58fr)_minmax(0,42fr)] gap-0 border-t pt-3">
          <section
            aria-labelledby="ani-quarterly-chart-title"
            className="min-w-0 pe-6"
          >
            <div className="mb-2 flex h-11 items-center justify-between gap-4">
              <div>
                <p id="ani-quarterly-chart-title" className="text-sm font-medium">
                  모델별 분기 생산량
                </p>
                <p aria-live="polite" className="mt-1 text-xs text-muted-foreground">
                  {selectedQuarter} 선택됨 · {visibleModels.length}개 모델
                </p>
              </div>
              <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
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
                <XAxis
                  axisLine={false}
                  dataKey="quarter"
                  fontSize={9}
                  interval={0}
                  tickLine={false}
                  tickMargin={6}
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
                  content={<ChartTooltipContent />}
                  cursor={false}
                />
                {visibleModels.map((model) => (
                  <Bar
                    dataKey={model.key}
                    fill={model.color}
                    isAnimationActive={false}
                    key={model.key}
                    stackId="ani-production"
                  >
                    {aniQuarterlyProduction.map((item) => (
                      <Cell
                        className="cursor-pointer transition-opacity focus:outline-none focus-visible:outline-none"
                        fillOpacity={
                          hoveredQuarter && hoveredQuarter !== item.quarter
                            ? 0.25
                            : 1
                        }
                        key={`${model.key}-${item.quarter}`}
                        stroke={
                          selectedQuarter === item.quarter
                            ? "var(--primary)"
                            : "transparent"
                        }
                        strokeWidth={selectedQuarter === item.quarter ? 1 : 0}
                      />
                    ))}
                    <LabelList
                      content={renderAniSegmentLabel}
                      dataKey={model.key}
                      fill={getLabelColor(model.type)}
                      position="center"
                    />
                    {model.key === topVisibleModelKey ? (
                      <LabelList
                        dataKey="visibleTotal"
                        fill="var(--foreground)"
                        fontSize={9}
                        fontWeight={600}
                        formatter={(value) => formatMu(Number(value))}
                        offset={8}
                        position="top"
                      />
                    ) : null}
                  </Bar>
                ))}
              </BarChart>
            </ChartContainer>
          </section>

          <aside className="min-w-0 border-s ps-6" aria-labelledby="ani-history-title">
            <div className="mb-2 h-11">
              <p className="text-xs font-medium tracking-[0.14em] text-primary uppercase">
                Forecast History
              </p>
              <h3 id="ani-history-title" className="mt-1 text-base font-semibold">
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
                  <XAxis
                    axisLine={false}
                    dataKey="period"
                    fontSize={9}
                    interval={0}
                    tickLine={false}
                    tickMargin={6}
                  />
                  <YAxis domain={visibleYAxisDomain} hide />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    cursor={false}
                  />
                  {visibleModels.map((model) => (
                    <Bar
                      dataKey={model.key}
                      fill={model.color}
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
                      {model.key === topVisibleModelKey ? (
                        <LabelList
                          dataKey="visibleTotal"
                          fill="var(--foreground)"
                          fontSize={8}
                          fontWeight={600}
                          formatter={(value) => formatMu(Number(value))}
                          offset={8}
                          position="top"
                        />
                      ) : null}
                    </Bar>
                  ))}
                </BarChart>
              </ChartContainer>
              <dl className="pt-5 text-sm leading-5">
                <div className="mb-3 border-b pb-2">
                  <dt className="text-xs text-muted-foreground">현재 Forecast</dt>
                  <dd className="mt-1 font-mono font-medium tabular-nums">
                    {formatMu(summary.currentTotal)}
                  </dd>
                </div>
                <div className="mb-3 border-b pb-2">
                  <dt className="text-xs text-muted-foreground">전월 대비</dt>
                  <dd
                    className={`mt-1 font-mono font-medium tabular-nums ${getDeltaClassName(summary.monthOverMonth)}`}
                  >
                    {formatSignedMu(summary.monthOverMonth)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">6개월 대비</dt>
                  <dd
                    className={`mt-1 font-mono font-medium tabular-nums ${getDeltaClassName(summary.sixMonth)}`}
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
