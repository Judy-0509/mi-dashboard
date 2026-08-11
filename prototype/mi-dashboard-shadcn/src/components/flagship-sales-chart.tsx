import { useState } from "react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"

import {
  flagshipSalesVendors,
  getFlagshipSalesChartData,
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
      dominantBaseline="middle"
      fill={props.fill ?? "var(--foreground)"}
      fontSize={9}
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
      fill="var(--foreground)"
      fontSize={9}
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
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Counterpoint / Flagship Sales
          </p>
          <CardTitle className="mt-1 text-xl font-semibold tracking-tight group-data-[size=sm]/card:text-xl">
            월별 플래그십 모델 판매량
          </CardTitle>
        </div>
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
            <ToggleGroupItem id={key} key={key}>
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </CardHeader>
      <CardContent className="min-w-0 pt-3">
        <div className="mb-3 grid min-w-0 gap-2">
          <div
            aria-label="Flagship Sales vendor filter"
            className="flex min-w-0 flex-wrap items-start gap-2"
            role="group"
          >
            <span className="w-16 pt-1 text-xs font-medium text-muted-foreground">
              Vendor
            </span>
            <div className="flex flex-wrap gap-2">
              {flagshipSalesVendors.map(({ key, label, color }) => {
                const isSelected = key === selectedVendor
                return (
                  <Button
                    aria-pressed={isSelected}
                    className="h-7 gap-1.5 px-2 text-xs"
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
            <span className="w-16 pt-1 text-xs font-medium text-muted-foreground">
              Model
            </span>
            <div className="flex min-w-0 flex-wrap gap-2">
              {vendor.models.map((model) => {
                const isSelected = selectedModelKeys.has(model.key)
                return (
                  <div className="inline-flex items-center" key={model.key}>
                    <Button
                      aria-pressed={isSelected}
                      className="h-7 rounded-e-none border-e-0 px-2 text-xs"
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
                      className="h-7 rounded-s-none px-1.5 text-[10px]"
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
          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2 text-xs text-muted-foreground">
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
              fontSize={9}
              interval={0}
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
                {model.key === visibleModels.at(-1)?.key ? (
                  <LabelList
                    content={renderFlagshipTotalLabel}
                    dataKey="total"
                    position="top"
                  />
                ) : null}
              </Bar>
            ))}
          </BarChart>
        </ChartContainer>

        <ul
          aria-label="Flagship Sales model legend"
          className="mt-2 flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground"
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
