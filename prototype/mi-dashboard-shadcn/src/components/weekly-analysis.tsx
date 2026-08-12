import { useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { getVendorLabelColor } from "@/data/vendor-catalog"
import {
  getWeeklyHeatmap,
  getWeeklyRegionalCumulative,
  getWeeklyVendorCumulative,
  weeklyRegionColors,
  weeklyRegions,
  type WeeklyMetric,
  type WeeklyRegion,
  type WeeklyTrendMetric,
  getWeeklyTrend,
  weeklyVendors,
  type WeeklyVendorKey,
} from "@/data/weekly"

const weeklyChartConfig = {
  USA: { label: "USA", color: weeklyRegionColors.USA },
  China: { label: "China", color: weeklyRegionColors.China },
  Japan: { label: "Japan", color: weeklyRegionColors.Japan },
  Europe: { label: "Europe", color: weeklyRegionColors.Europe },
  India: { label: "India", color: weeklyRegionColors.India },
  ...Object.fromEntries(
    weeklyVendors.map(({ key, label, color }) => [key, { label, color }]),
  ),
  ...Object.fromEntries(
    weeklyVendors.map(({ label, color }) => [label, { label, color }]),
  ),
} satisfies ChartConfig

const weeklyTrendConfig = {
  y2023: { label: "2023", color: "var(--muted-foreground)" },
  y2024: { label: "2024", color: "var(--muted-foreground)" },
  y2025: { label: "2025", color: "var(--chart-2)" },
  y2026: { label: "2026", color: "var(--chart-4)" },
} satisfies ChartConfig

const weeklyTrendLines = [
  { dataKey: "y2023", opacity: 0.45, width: 1.5 },
  { dataKey: "y2024", opacity: 0.75, width: 1.5 },
  { dataKey: "y2025", opacity: 0.8, width: 2 },
  { dataKey: "y2026", opacity: 1, width: 2.5 },
] as const

function formatMetric(value: number | null) {
  if (value === null) {
    return "—"
  }

  return `${value < 0 ? "△" : value > 0 ? "+" : ""}${Math.abs(value).toFixed(1)}%`
}

function isWeeklyVendor(value: string): value is WeeklyVendorKey {
  return weeklyVendors.some(({ key }) => key === value)
}

function WeeklyTrendChart({
  data,
  metric,
  label,
}: {
  data: ReturnType<typeof getWeeklyTrend>
  metric: WeeklyTrendMetric
  label: string
}) {
  return (
    <ChartContainer
      aria-label={label}
      className="h-[250px] w-full min-w-0"
      config={weeklyTrendConfig}
    >
      <LineChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          axisLine={false}
          dataKey="week"
          tickLine={false}
          tickMargin={8}
          ticks={["W01", "W13", "W26", "W39", "W52"]}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) =>
            metric === "share"
              ? `${Number(value).toFixed(0)}%`
              : Number(value).toFixed(0)
          }
          width={36}
        />
        <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
        {weeklyTrendLines.map((line) => (
          <Line
            activeDot={{ r: 4 }}
            connectNulls={false}
            dataKey={line.dataKey}
            dot={{ r: 2 }}
            isAnimationActive={false}
            key={line.dataKey}
            name={weeklyTrendConfig[line.dataKey].label}
            stroke={`var(--color-${line.dataKey})`}
            strokeOpacity={line.opacity}
            strokeWidth={line.width}
            type="monotone"
          />
        ))}
      </LineChart>
    </ChartContainer>
  )
}

function WeeklyCumulativeChart({
  data,
  metric,
  label,
}: {
  data:
    | ReturnType<typeof getWeeklyRegionalCumulative>
    | ReturnType<typeof getWeeklyVendorCumulative>
  metric: WeeklyTrendMetric
  label: string
}) {
  const chartData = data.years.map((year) => ({
    year: String(year.year),
    total:
      metric === "share"
        ? year.total === null
          ? null
          : 100
        : year.total,
    ...Object.fromEntries(
      year.segments.map((segment) => [
        segment.name,
        metric === "share"
          ? year.total === null || year.total === 0 || segment.value === null
            ? null
            : (segment.value / year.total) * 100
          : segment.value,
      ])
    ),
  }))

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_120px] gap-2">
      <ChartContainer
        aria-label={label}
        className="h-[240px] w-full min-w-0"
        config={weeklyChartConfig}
      >
        <BarChart
          accessibilityLayer
          barCategoryGap="28%"
          data={chartData}
          margin={{ top: 24, right: 4, left: 4, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            axisLine={{ stroke: "var(--muted-foreground)", strokeOpacity: 0.45 }}
            dataKey="year"
            tickLine={false}
            tickMargin={8}
          />
          <YAxis hide />
          <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
          {data.segmentNames.map((segmentName, index) => (
            <Bar
              dataKey={segmentName}
              fill={`var(--color-${segmentName})`}
              isAnimationActive={false}
              key={segmentName}
              stackId="weekly"
            >
              <LabelList
                dataKey={segmentName}
                fill={getVendorLabelColor(data.years[0].segments[index].color)}
                className="type-chart-segment-value"
                fontSize={10}
                fontWeight={600}
                formatter={(value) =>
                  value === null
                    ? "—"
                    : `${Number(value).toFixed(1)}${metric === "share" ? "%" : ""}`
                }
                position="center"
              />
              {index === data.segmentNames.length - 1 ? (
                <LabelList
                  dataKey="total"
                  fill="var(--foreground)"
                  className="type-chart-total"
                  fontSize={11}
                  fontWeight={600}
                  formatter={(value) =>
                    value === null
                      ? "—"
                      : `${Number(value).toFixed(1)}${metric === "share" ? "%" : "Mu"}`
                  }
                  position="top"
                />
              ) : null}
            </Bar>
          ))}
        </BarChart>
      </ChartContainer>
      <ul
        aria-label="Cumulative composition legend"
        className="type-control flex min-w-0 flex-col gap-1.5 pt-1 whitespace-nowrap text-muted-foreground"
      >
        {data.years[0].segments.map((segment) => (
          <li className="flex items-center gap-1.5" key={segment.name}>
            <i
              aria-hidden="true"
              className="size-1.5 shrink-0"
              style={{ backgroundColor: segment.color }}
            />
            {segment.name}
            {segment.value === null ? (
              <span aria-label="데이터 없음">
                —<span className="sr-only">데이터 없음</span>
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function WeeklyAnalysis() {
  const [metric, setMetric] = useState<WeeklyMetric>("yoy")
  const [selectedVendor, setSelectedVendor] =
    useState<WeeklyVendorKey | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<WeeklyRegion>("Total")
  const heatmap = useMemo(() => getWeeklyHeatmap(metric), [metric])
  const regionalCumulative = useMemo(
    () =>
      getWeeklyRegionalCumulative(
        selectedVendor,
      ),
    [selectedVendor]
  )
  const vendorCumulative = useMemo(
    () => getWeeklyVendorCumulative(selectedRegion),
    [selectedRegion]
  )
  const selectedTrend = useMemo(
    () =>
      getWeeklyTrend(
        selectedRegion,
        selectedVendor,
        "mu"
      ),
    [selectedRegion, selectedVendor]
  )
  const [cumulativeMetric, setCumulativeMetric] =
    useState<WeeklyTrendMetric>("mu")
  const selectedVendorLabel =
    weeklyVendors.find(({ key }) => key === selectedVendor)?.label ?? "Total"
  const selectedRegionLabel = selectedRegion

  return (
    <section
      className="grid grid-cols-[minmax(0,58fr)_minmax(0,42fr)] gap-4"
      aria-label="Weekly market analysis"
    >
      <Card className="min-w-0 border-border shadow-none" size="sm">
        <CardHeader className="flex flex-row items-start justify-between gap-4 border-b pb-3">
          <div>
            <p className="type-eyebrow text-muted-foreground">
              Weekly market mix
            </p>
            <CardTitle className="type-card-title mt-1 tracking-tight">
              Vendor × Region
            </CardTitle>
          </div>
          <ToggleGroup
            aria-label="Heatmap metric"
            onSelectionChange={(selection) => {
              const next = Array.from(selection)[0]
              if (next === "yoy" || next === "wow") {
                setMetric(next)
              }
            }}
            selectedKeys={new Set([metric])}
            selectionMode="single"
            size="sm"
            variant="outline"
          >
            <ToggleGroupItem id="yoy">YoY</ToggleGroupItem>
            <ToggleGroupItem id="wow">WoW</ToggleGroupItem>
          </ToggleGroup>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="flex h-[300px] overflow-hidden border">
            <table
              className="type-table-body h-full w-full border-collapse"
              aria-label="Vendor by region weekly heatmap"
            >
              <thead className="type-table-header bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-3 py-1.5 text-left">Vendor</th>
                  {weeklyRegions.map((regionName) => (
                    <th
                      className="px-2 py-1.5 text-right"
                      key={regionName}
                    >
                      {regionName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmap.map((row) => (
                  <tr className="border-t" key={row.label}>
                    <th className="type-table-header px-3 py-1.5 text-left" scope="row">
                      {row.label}
                    </th>
                    {row.values.map((value, index) => {
                      const regionName = weeklyRegions[index]
                      const vendor =
                          row.key === "total"
                            ? null
                            : isWeeklyVendor(row.key)
                            ? row.key
                            : null
                      const isSelected =
                        vendor === selectedVendor &&
                        regionName === selectedRegion

                      return (
                        <td
                          className="p-0 text-right"
                          key={`${row.label}-${regionName}`}
                        >
                          <button
                            aria-label={`${row.label} × ${regionName}: ${value === null ? "데이터 없음" : formatMetric(value)}`}
                            aria-pressed={isSelected}
                            className={`type-table-body block w-full rounded-sm border border-transparent px-2 py-1.5 text-right tabular-nums transition-colors hover:bg-muted/60 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:font-semibold ${
                              value !== null && value < 0
                                ? "text-destructive"
                                : "text-foreground"
                            }`}
                            disabled={value === null}
                            onClick={() => {
                              setSelectedVendor(vendor)
                              setSelectedRegion(regionName)
                            }}
                            type="button"
                          >
                            {formatMetric(value)}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 shrink-0 border-t pt-3">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <p className="type-eyebrow text-muted-foreground">
                  Weekly trend
                </p>
                <h3 className="type-section-title mt-1 tracking-tight">
                  {selectedVendorLabel} × {selectedRegionLabel} weekly sell-out
                </h3>
              </div>
              <p className="type-control pt-1 text-muted-foreground">
                2023–2025 W1–W52 · 2026 W1–W32
              </p>
            </div>
            <div className="type-control mb-2 flex items-center gap-3 text-muted-foreground">
              {weeklyTrendLines.map((line) => (
                <span className="flex items-center gap-1.5" key={line.dataKey}>
                  <i
                    aria-hidden="true"
                    className="size-1.5 rounded-full"
                    style={{
                      backgroundColor: weeklyTrendConfig[line.dataKey].color,
                      opacity: line.opacity,
                    }}
                  />
                  {weeklyTrendConfig[line.dataKey].label}
                </span>
              ))}
            </div>
            <WeeklyTrendChart
              data={selectedTrend}
              label={`${selectedVendorLabel} × ${selectedRegionLabel} weekly sell-out trend`}
              metric="mu"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="min-w-0 border-border shadow-none" size="sm">
        <CardHeader className="flex flex-row items-start justify-between gap-4 border-b pb-3">
          <div>
            <p className="type-eyebrow text-muted-foreground">
              Cumulative sell-out
            </p>
            <CardTitle className="type-card-title mt-1 tracking-tight">
              4-year cumulative composition
            </CardTitle>
          </div>
          <ToggleGroup
            aria-label="Cumulative metric"
            onSelectionChange={(selection) => {
              const next = Array.from(selection)[0]
              if (next === "mu" || next === "share") {
                setCumulativeMetric(next)
              }
            }}
            selectedKeys={new Set([cumulativeMetric])}
            selectionMode="single"
            size="sm"
            variant="outline"
          >
            <ToggleGroupItem id="mu">Mu</ToggleGroupItem>
            <ToggleGroupItem id="share">M/S (%)</ToggleGroupItem>
          </ToggleGroup>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="grid min-w-0 gap-4">
            <div className="border-b pb-3">
              <div className="mb-2">
                <p className="type-eyebrow text-muted-foreground">
                  Regional composition
                </p>
                <h3 className="type-section-title mt-1 tracking-tight">
                  <span className="text-primary">{selectedVendorLabel}</span> · cumulative sell-out by region
                </h3>
              </div>
              <WeeklyCumulativeChart
                data={regionalCumulative}
                label={`${selectedVendorLabel} cumulative sell-out by region`}
                metric={cumulativeMetric}
              />
            </div>
            <div>
              <div className="mb-2">
                <p className="type-eyebrow text-muted-foreground">
                  Vendor composition
                </p>
                <h3 className="type-section-title mt-1 tracking-tight">
                  <span className="text-primary">{selectedRegionLabel}</span> · cumulative sell-out by vendor
                </h3>
              </div>
              <WeeklyCumulativeChart
                data={vendorCumulative}
                label={`${selectedRegionLabel} cumulative sell-out by vendor`}
                metric={cumulativeMetric}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
