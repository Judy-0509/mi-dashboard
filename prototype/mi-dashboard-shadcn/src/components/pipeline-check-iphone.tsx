import type * as React from "react"
import { useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  InventoryQuarterSelect,
} from "@/components/inventory-quarter-select"
import {
  getDefaultInventoryQuarters,
  type InventoryQuarterSelection,
} from "@/data/inventory-quarters"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { AniModelKey, AniModelTypeKey } from "@/data/ani"
import {
  getIPhonePipelineChartData,
  iphonePipelineData,
  iphonePipelineExecutiveSummary,
  iphonePipelineLineups,
  iphonePipelineModels,
  iphonePipelineQuarters,
  iphonePipelineYAxisDomain,
  iphonePipelineYAxisTicks,
  type IPhonePipelineFlowMetric,
  type IPhonePipelineInventoryMetric,
} from "@/data/pipeline-check-iphone"

const chartConfig = Object.fromEntries(
  iphonePipelineModels.map((model) => [
    model.key,
    { label: model.label, color: model.color },
  ]),
) satisfies ChartConfig

type LabelProps = {
  value?: unknown
  x?: unknown
  y?: unknown
  width?: unknown
  height?: unknown
  fill?: string
  payload?: { topModelKey?: AniModelKey }
}

function getLabelColor(type: AniModelTypeKey) {
  return type === "basic" || type === "plusAir" || type === "e"
    ? "#111827"
    : "#ffffff"
}

function SegmentLabel(props: LabelProps) {
  const value = Number(props.value)
  const x = Number(props.x)
  const y = Number(props.y)
  const width = Number(props.width)
  const height = Number(props.height)
  if (!value || height < 12) return null

  return (
    <text
      className="type-chart-segment-value"
      dominantBaseline="middle"
      fill={props.fill}
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

function TotalLabel({ modelKey, ...props }: LabelProps & { modelKey: AniModelKey }) {
  const value = Number(props.value)
  const x = Number(props.x)
  const y = Number(props.y)
  const width = Number(props.width)
  if (props.payload?.topModelKey !== modelKey || !Number.isFinite(value)) return null

  return (
    <text
      className="type-chart-total"
      fill="var(--foreground)"
      fontSize={11}
      fontWeight={600}
      textAnchor="middle"
      x={x + width / 2}
      y={y - 6}
    >
      {value.toFixed(1)}Mu
    </text>
  )
}

function PatternDefs({ prefix }: { prefix: string }) {
  return (
    <defs>
      {iphonePipelineModels
        .filter((model) => model.type === "e" || model.type === "foldable")
        .map((model) => (
          <pattern
            height="8"
            id={`${prefix}-${model.key}`}
            key={model.key}
            patternUnits="userSpaceOnUse"
            width="8"
          >
            <rect fill={model.color} fillOpacity={0.22} height="8" width="8" />
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

function modelFill(model: (typeof iphonePipelineModels)[number], prefix: string) {
  return model.type === "e" || model.type === "foldable"
    ? `url(#${prefix}-${model.key})`
    : model.color
}

function IPhonePipelineChart({
  metric,
  title,
}: {
  metric: IPhonePipelineFlowMetric
  title: "Production" | "Sell-in" | "Sell-out"
}) {
  const data = getIPhonePipelineChartData(metric)
  const titleId = `iphone-pipeline-${metric}-title`

  return (
    <section aria-labelledby={titleId} className="min-w-0">
      <h3 className="type-section-title mb-2" id={titleId}>{title}</h3>
      <ChartContainer className="h-[300px] w-full min-w-0" config={chartConfig}>
        <BarChart
          accessibilityLayer
          barCategoryGap="10%"
          data={data}
          margin={{ top: 24, right: 2, left: 0, bottom: 4 }}
        >
          <CartesianGrid vertical={false} />
          <PatternDefs prefix={`iphone-pipeline-${metric}`} />
          <XAxis
            axisLine={false}
            dataKey="quarter"
            fontSize={10}
            interval={0}
            tickLine={false}
            tickMargin={4}
          />
          <YAxis
            axisLine={false}
            domain={iphonePipelineYAxisDomain}
            fontSize={10}
            tickFormatter={(value) => `${value}m`}
            ticks={iphonePipelineYAxisTicks}
            tickLine={false}
            tickMargin={4}
            width={30}
          />
          <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
          {metric === "production" ? (
            <ReferenceLine
              label={{ value: "NEW · e", fill: "var(--muted-foreground)", fontSize: 10 }}
              stroke="var(--muted-foreground)"
              strokeDasharray="3 3"
              x="2025 Q2"
            />
          ) : null}
          {iphonePipelineModels.map((model) => (
            <Bar
              dataKey={model.key}
              fill={modelFill(model, `iphone-pipeline-${metric}`)}
              isAnimationActive={false}
              key={model.key}
              stackId="iphone-pipeline"
            >
              <LabelList
                content={<SegmentLabel fill={getLabelColor(model.type)} />}
                dataKey={model.key}
                position="center"
              />
              <LabelList
                content={<TotalLabel modelKey={model.key} />}
                dataKey="total"
                position="top"
              />
            </Bar>
          ))}
        </BarChart>
      </ChartContainer>
    </section>
  )
}

function IPhoneInventoryTable({
  metric,
  onQuarterChange,
  selectedQuarters,
  title,
}: {
  metric: IPhonePipelineInventoryMetric
  onQuarterChange: (
    index: number,
    quarter: (typeof iphonePipelineQuarters)[number],
  ) => void
  selectedQuarters: InventoryQuarterSelection<
    (typeof iphonePipelineQuarters)[number]
  >
  title: "Production Inventory" | "Channel Inventory"
}) {
  const titleId = `iphone-pipeline-${metric}-title`

  return (
    <section aria-labelledby={titleId} className="min-w-0">
      <h3 className="type-section-title mb-2" id={titleId}>{title}</h3>
      <table className="type-table-body h-[300px] w-full table-fixed border-collapse tabular-nums">
        <caption className="sr-only">{title} · 단위 Mu</caption>
        <colgroup>
          <col className="w-[48px]" />
          {selectedQuarters.map((quarter, index) => <col key={`${quarter}-${index}`} />)}
        </colgroup>
        <thead className="type-table-header bg-muted/40 text-muted-foreground">
          <tr>
            <th className="border px-1 py-1 text-left" scope="col">Lineup</th>
            {selectedQuarters.map((quarter, index) => (
              <th className="border px-1 py-1 text-center" key={`${quarter}-${index}`} scope="col">
                <InventoryQuarterSelect
                  availableQuarters={iphonePipelineQuarters}
                  index={index}
                  onChange={onQuarterChange}
                  value={quarter}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {iphonePipelineLineups.map((lineup) => (
            <tr key={lineup.key}>
              <th className="type-table-header border px-1 py-1 text-left" scope="row">{lineup.label}</th>
              {selectedQuarters.map((quarter, index) => {
                const row = iphonePipelineData.find((item) => item.quarter === quarter)!
                return (
                  <td className="border px-1 py-1 text-right" key={`${quarter}-${index}`}>
                    {row[metric][lineup.key].toFixed(1)}Mu
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export function PipelineCheckIPhone(): React.ReactElement {
  const generations = [...new Set(iphonePipelineModels.map((model) => model.generation))]
  const [selectedInventoryQuarters, setSelectedInventoryQuarters] = useState(
    () => getDefaultInventoryQuarters(iphonePipelineQuarters),
  )
  const changeInventoryQuarter = (
    index: number,
    quarter: (typeof iphonePipelineQuarters)[number],
  ) => {
    setSelectedInventoryQuarters((current) => {
      const next = [...current] as typeof current
      next[index] = quarter
      return next
    })
  }

  return (
    <>
      <Card className="my-4 border-border shadow-none" size="sm">
        <CardHeader className="pb-2">
          <CardTitle className="type-executive-title">Executive Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="type-executive-body grid gap-2 text-muted-foreground">
            {iphonePipelineExecutiveSummary.map((observation) => (
              <li className="flex gap-3" key={observation}>
                <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 bg-primary" />
                <span>{observation}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="min-w-0 border-border shadow-none" size="sm">
        <CardHeader className="flex flex-row items-start justify-between gap-4 border-b pb-3">
          <div>
            <p className="type-eyebrow text-muted-foreground">Pipeline Check · iPhone</p>
            <CardTitle className="type-card-title mt-1 tracking-tight">
              Production · Sell-in · Sell-out
            </CardTitle>
          </div>
          <ul aria-label="iPhone model color legend" className="type-control flex flex-wrap justify-end gap-2 text-muted-foreground">
            {generations.map((generation) => (
              <li className="flex h-7 items-center gap-1.5 border bg-secondary px-2" key={generation}>
                <span>{generation.replace("iphone", "iPhone ")}</span>
                {iphonePipelineModels.filter((model) => model.generation === generation).map((model) => (
                  <i
                    aria-label={model.label}
                    className="size-2.5"
                    key={model.key}
                    style={{ background: model.color }}
                    title={model.label}
                  />
                ))}
              </li>
            ))}
          </ul>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_210px_minmax(0,1fr)_210px_minmax(0,1fr)] items-stretch gap-2">
            <IPhonePipelineChart metric="production" title="Production" />
            <IPhoneInventoryTable
              metric="productionInventory"
              onQuarterChange={changeInventoryQuarter}
              selectedQuarters={selectedInventoryQuarters}
              title="Production Inventory"
            />
            <IPhonePipelineChart metric="sellIn" title="Sell-in" />
            <IPhoneInventoryTable
              metric="channelInventory"
              onQuarterChange={changeInventoryQuarter}
              selectedQuarters={selectedInventoryQuarters}
              title="Channel Inventory"
            />
            <IPhonePipelineChart metric="sellOut" title="Sell-out" />
          </div>
        </CardContent>
      </Card>
    </>
  )
}
