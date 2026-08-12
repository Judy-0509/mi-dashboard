import { useState } from "react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"

import {
  flagshipSalesVendors,
  getFlagshipSalesChartData,
  getFlagshipSalesGenerationComparison,
  type FlagshipSalesModel,
  type FlagshipSalesVendorKey,
  type FlagshipSalesView,
} from "@/data/flagship-sales"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

const viewOptions = [
  { key: "calendar", label: "Calendar Month" },
  { key: "launch", label: "Since Launch" },
] as const satisfies readonly { key: FlagshipSalesView; label: string }[]

type LabelProps = {
  value?: unknown
  x?: unknown
  y?: unknown
  width?: unknown
  height?: unknown
  fill?: string
}

function formatMonth(month: string) {
  return `${month.slice(2, 4)}년 ${Number(month.slice(5))}월`
}

function formatValue(value: unknown) {
  return value === null || value === undefined ? "" : Number(value).toFixed(0)
}

function formatSignedValue(value: number, suffix: string) {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}${suffix}`
}

function getComparisonDeltaClassName(value: number) {
  return value > 0
    ? "text-primary"
    : value < 0
      ? "text-destructive"
      : "text-muted-foreground"
}

function getSegmentLabelColor(color: string) {
  const channels = color
    .replace("#", "")
    .match(/.{2}/g)
    ?.map((channel) => Number.parseInt(channel, 16))
  if (!channels || channels.length !== 3) return "var(--foreground)"
  const luminance = (channels[0] * 299 + channels[1] * 587 + channels[2] * 114) / 1000
  return luminance > 150 ? "var(--foreground)" : "var(--background)"
}

function renderFlagshipSegmentLabel(props: LabelProps) {
  const value = Number(props.value)
  const width = Number(props.width)
  const x = Number(props.x)
  const y = Number(props.y)
  const height = Number(props.height)

  if (
    !Number.isFinite(value) ||
    value === 0 ||
    !Number.isFinite(height) ||
    height < 14 ||
    !Number.isFinite(width) ||
    !Number.isFinite(x) ||
    !Number.isFinite(y)
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
      {value.toFixed(0)}
    </text>
  )
}

function renderFlagshipTotalLabel(props: LabelProps) {
  if (props.value === "" || props.value === null || props.value === undefined) {
    return ""
  }

  const value = Number(props.value)
  const x = Number(props.x)
  const y = Number(props.y)
  const width = Number(props.width)

  if (
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
      y={y - 6}
    >
      {formatValue(value)}
    </text>
  )
}

function getVendor(vendorKey: FlagshipSalesVendorKey) {
  return (
    flagshipSalesVendors.find(({ key }) => key === vendorKey) ??
    flagshipSalesVendors[0]
  )
}

function getChartConfig(models: readonly FlagshipSalesModel[]) {
  return Object.fromEntries(
    models.map((model) => [
      model.key,
      { label: model.label, color: model.color },
    ]),
  ) satisfies ChartConfig
}

export function FlagshipSalesChart() {
  const [selectedVendor, setSelectedVendor] =
    useState<FlagshipSalesVendorKey>("apple")
  const [view, setView] = useState<FlagshipSalesView>("calendar")
  const [selectedModelKeys, setSelectedModelKeys] = useState<Set<string>>(
    () => new Set(getVendor("apple").models.map(({ key }) => key)),
  )

  const vendor = getVendor(selectedVendor)
  const visibleModels = vendor.models.filter(({ key }) =>
    selectedModelKeys.has(key),
  )
  const chartData = getFlagshipSalesChartData(
    selectedVendor,
    view,
    visibleModels.map(({ key }) => key),
  )
  const chartConfig = getChartConfig(visibleModels)
  const comparison = getFlagshipSalesGenerationComparison(selectedVendor)
  const maxTotal = Math.max(...chartData.map(({ total }) => total), 0)
  const yAxisDomain = [0, Math.max(10, Math.ceil((maxTotal * 1.12) / 10) * 10)] as const

  const selectVendor = (vendorKey: FlagshipSalesVendorKey) => {
    const nextVendor = getVendor(vendorKey)
    setSelectedVendor(vendorKey)
    setSelectedModelKeys(new Set(nextVendor.models.map(({ key }) => key)))
  }

  const toggleModel = (modelKey: string) => {
    setSelectedModelKeys((current) => {
      const next = new Set(current)
      if (next.has(modelKey)) {
        if (next.size > 1) next.delete(modelKey)
      } else {
        next.add(modelKey)
      }
      return next
    })
  }

  const onlyModel = (modelKey: string) => {
    setSelectedModelKeys(new Set([modelKey]))
  }

  return (
    <Card
      aria-label="Flagship Sales monthly model sales"
      className="mt-4 min-w-0 border-border shadow-none"
      size="sm"
    >
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 border-b pb-3">
        <div>
          <p className="type-eyebrow text-muted-foreground">
            Counterpoint / Flagship Sales
          </p>
          <CardTitle className="type-card-title mt-1 tracking-tight">
            월별 플래그십 모델 판매량
          </CardTitle>
          <p className="type-control mt-1 text-muted-foreground">
            모델명·출시월은 제조사 공식 출처, 판매량은 예시 추정치입니다.
          </p>
        </div>
      </CardHeader>
      <CardContent className="min-w-0 pt-3">
        <div className="mb-3 grid min-w-0 gap-2">
          <div className="flex min-w-0 flex-wrap items-start gap-2" role="group">
            <span className="type-control-label w-16 pt-1 text-muted-foreground">
              View
            </span>
            <ToggleGroup
              aria-label="Flagship Sales axis"
              onSelectionChange={(selection) => {
                const next = Array.from(selection)[0]
                if (next === "calendar" || next === "launch") setView(next)
              }}
              selectedKeys={new Set([view])}
              selectionMode="single"
              size="sm"
              variant="outline"
            >
              {viewOptions.map(({ key, label }) => (
                <ToggleGroupItem className="h-8" id={key} key={key}>
                  {label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <div
            aria-label="Flagship Sales vendor filter"
            className="flex min-w-0 flex-wrap items-start gap-2"
            role="group"
          >
            <span className="type-control-label w-16 pt-1 text-muted-foreground">
              Vendor
            </span>
            <div className="flex flex-wrap gap-2">
              {flagshipSalesVendors.map(({ key, label, color, availability }) => {
                const isSelected = key === selectedVendor
                return (
                  <Button
                    aria-pressed={isSelected}
                    className="type-control h-8 gap-1.5 px-2.5"
                    isDisabled={availability === "unavailable"}
                    key={key}
                    onPress={() => selectVendor(key)}
                    size="sm"
                    style={isSelected ? { borderColor: color } : undefined}
                    variant={isSelected ? "secondary" : "outline"}
                  >
                    <i
                      aria-hidden="true"
                      className="size-2"
                      style={{ backgroundColor: color }}
                    />
                    {label}
                    {availability === "unavailable" ? (
                      <span aria-label="데이터 없음">
                        —<span className="sr-only">데이터 없음</span>
                      </span>
                    ) : null}
                  </Button>
                )
              })}
            </div>
          </div>
          <div
            aria-label="Flagship Sales model filter"
            className="flex min-w-0 flex-wrap items-start gap-2"
            role="group"
          >
            <span className="type-control-label w-16 pt-1 text-muted-foreground">
              Model
            </span>
            <div className="flex min-w-0 flex-wrap gap-2">
              {vendor.models.map((model) => {
                const isSelected = selectedModelKeys.has(model.key)
                return (
                  <div className="inline-flex items-center" key={model.key}>
                    <Button
                      aria-pressed={isSelected}
                      className="type-control h-8 rounded-e-none border-e-0 px-2.5"
                      onPress={() => toggleModel(model.key)}
                      size="sm"
                      style={isSelected ? { borderColor: model.color } : undefined}
                      variant={isSelected ? "secondary" : "outline"}
                    >
                      <i
                        aria-hidden="true"
                        className="size-2"
                        style={{ backgroundColor: model.color }}
                      />
                      {model.label}
                    </Button>
                    <Button
                      aria-label={`ONLY ${model.label}`}
                      className="type-control-label h-8 rounded-s-none px-2"
                      onPress={() => onlyModel(model.key)}
                      size="sm"
                      variant="outline"
                    >
                      ONLY
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="type-control flex flex-wrap items-center justify-between gap-2 border-t pt-2 text-muted-foreground">
            <p>
              {view === "calendar"
                ? "Calendar Month · 출시 전 모델은 0으로 표시"
                : "Since Launch · 출시월을 M0로 정렬"}
            </p>
            <p>
              {vendor.label} · {visibleModels.length}/{vendor.models.length}개 모델
            </p>
          </div>
        </div>

        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <ChartContainer
            aria-label={`${vendor.label} flagship sales stacked bar chart`}
            className="h-[360px] w-full min-w-0"
            config={chartConfig}
          >
            <BarChart
              accessibilityLayer
              barCategoryGap="12%"
              data={chartData}
              margin={{ top: 28, right: 8, left: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="label"
                fontSize={10}
                interval={view === "calendar" ? 1 : 0}
                tickFormatter={view === "calendar" ? formatMonth : undefined}
                tickLine={false}
                tickMargin={7}
              />
              <YAxis
                axisLine={false}
                domain={yAxisDomain}
                tickFormatter={(value) => Number(value).toFixed(0)}
                tickLine={false}
                tickMargin={7}
                width={32}
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
              {visibleModels.map((model) => (
                <Bar
                  dataKey={model.key}
                  fill={model.color}
                  isAnimationActive={false}
                  key={model.key}
                  name={model.label}
                  stackId="flagship-sales"
                >
                  <LabelList
                    content={renderFlagshipSegmentLabel}
                    dataKey={model.key}
                    fill={getSegmentLabelColor(model.color)}
                    position="center"
                  />
                  <LabelList
                    content={renderFlagshipTotalLabel}
                    position="top"
                    valueAccessor={(entry) =>
                      entry.payload.topModelKey === model.key
                        ? entry.payload.total
                        : ""
                    }
                  />
                </Bar>
              ))}
            </BarChart>
          </ChartContainer>

          <aside
            aria-labelledby="flagship-comparison-title"
            className="min-w-0 lg:border-s lg:ps-4"
          >
            <div className="mb-2">
              <p className="type-eyebrow text-primary">
                Generation comparison
              </p>
              <h3
                className="type-section-title mt-1"
                id="flagship-comparison-title"
              >
                세대별 판매 비교
              </h3>
              <p className="type-control mt-1 text-muted-foreground">
                {comparison
                  ? `${comparison.currentGenerationLabel} vs ${comparison.previousGenerationLabel} · 동일 출시 후 기간`
                  : "— 데이터 없음"}
              </p>
            </div>
            <div className="overflow-hidden border">
              <table
                aria-label={`${vendor.label} generation sales comparison`}
                className="type-table-body w-full table-fixed border-collapse"
              >
                <caption className="sr-only">
                  {vendor.label} generation sales comparison
                </caption>
                <colgroup>
                  <col className="w-[32%]" />
                  <col className="w-[12%]" />
                  <col className="w-[18%]" />
                  <col className="w-[18%]" />
                  <col className="w-[20%]" />
                </colgroup>
                <thead className="type-table-header bg-muted/40 text-muted-foreground">
                  <tr>
                    <th
                      className="px-1.5 py-1.5 text-left"
                      scope="col"
                    >
                      모델
                    </th>
                    <th
                      className="px-1 py-1.5 text-right"
                      scope="col"
                    >
                      기간
                    </th>
                    <th
                      className="px-1 py-1.5 text-right"
                      scope="col"
                    >
                      현재
                    </th>
                    <th
                      className="px-1 py-1.5 text-right"
                      scope="col"
                    >
                      이전
                    </th>
                    <th
                      className="px-1.5 py-1.5 text-right"
                      scope="col"
                    >
                      증감
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {comparison ? comparison.rows.map((row, index) => {
                    const deltaClassName = getComparisonDeltaClassName(
                      row.deltaMu
                    )
                    return (
                      <tr
                        className={index === 0 ? "bg-muted/30" : undefined}
                        key={row.rowLabel}
                      >
                        <th
                          className="type-table-header px-1.5 py-1.5 text-left align-top"
                          scope="row"
                        >
                          <span className="block truncate">{row.rowLabel}</span>
                          <span className="type-table-body block truncate text-muted-foreground">
                            {row.currentModelLabel} / {row.previousModelLabel}
                          </span>
                        </th>
                        <td className="px-1 py-1.5 text-right align-top whitespace-nowrap text-muted-foreground tabular-nums">
                          {row.duration === null
                            ? "동일"
                            : `${row.duration}개월`}
                        </td>
                        <td className="px-1 py-1.5 text-right align-top whitespace-nowrap tabular-nums">
                          {row.currentCumulative.toFixed(1)}Mu
                        </td>
                        <td className="px-1 py-1.5 text-right align-top whitespace-nowrap tabular-nums">
                          {row.previousCumulative.toFixed(1)}Mu
                        </td>
                        <td
                          className={`type-table-body px-1.5 py-1.5 text-right align-top whitespace-nowrap tabular-nums ${deltaClassName}`}
                        >
                          <span className="block">
                            {formatSignedValue(row.deltaMu, "Mu")}
                          </span>
                          <span className="block">
                            {formatSignedValue(row.deltaPercent, "%")}
                          </span>
                        </td>
                      </tr>
                    )
                  }) : (
                    <tr>
                      <th className="type-table-header px-1.5 py-1.5 text-left" scope="row">
                        —<span className="sr-only">데이터 없음</span>
                      </th>
                      <td className="px-1 py-1.5 text-right" colSpan={4}>
                        데이터 없음
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </aside>
        </div>

        <ul
          aria-label="Flagship Sales model legend"
          className="type-control mt-2 flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-muted-foreground"
        >
          {visibleModels.map((model) => (
            <li className="flex items-center gap-1.5" key={model.key}>
              <i
                aria-hidden="true"
                className="size-1.5 shrink-0"
                style={{ backgroundColor: model.color }}
              />
              {model.label} · {formatMonth(model.releaseMonth)}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
