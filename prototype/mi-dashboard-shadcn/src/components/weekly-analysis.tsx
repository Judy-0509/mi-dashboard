import { type Key, useMemo, useState } from "react"
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
import {
  getWeeklyCumulative,
  getWeeklyHeatmap,
  weeklyRegionColors,
  weeklyRegions,
  weeklyVendorColors,
  type WeeklyMetric,
  type WeeklyRegion,
  type WeeklyTrendMetric,
  getWeeklyTrend,
  weeklyVendors,
} from "@/data/weekly"

const weeklyChartConfig = {
  USA: { label: "USA", color: weeklyRegionColors.USA },
  China: { label: "China", color: weeklyRegionColors.China },
  Japan: { label: "Japan", color: weeklyRegionColors.Japan },
  Europe: { label: "Europe", color: weeklyRegionColors.Europe },
  India: { label: "India", color: weeklyRegionColors.India },
  Apple: { label: "Apple", color: weeklyVendorColors.Apple },
  Samsung: { label: "Samsung", color: weeklyVendorColors.Samsung },
  Xiaomi: { label: "Xiaomi", color: weeklyVendorColors.Xiaomi },
  OPPO: { label: "OPPO", color: weeklyVendorColors.OPPO },
  vivo: { label: "vivo", color: weeklyVendorColors.vivo },
  Honor: { label: "Honor", color: weeklyVendorColors.Honor },
  Others: { label: "Others", color: weeklyVendorColors.Others },
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
    return "N/A"
  }

  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`
}

function isWeeklyRegion(value: Key | undefined): value is WeeklyRegion {
  return (
    typeof value === "string" && weeklyRegions.includes(value as WeeklyRegion)
  )
}

function isWeeklyVendor(
  value: Key | undefined
): value is (typeof weeklyVendors)[number] {
  return (
    typeof value === "string" &&
    weeklyVendors.includes(value as (typeof weeklyVendors)[number])
  )
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

export function WeeklyAnalysis() {
  const [metric, setMetric] = useState<WeeklyMetric>("yoy")
  const [region, setRegion] = useState<WeeklyRegion>("Total")
  const [trendVendor, setTrendVendor] =
    useState<(typeof weeklyVendors)[number]>("Apple")
  const [trendMetric, setTrendMetric] = useState<WeeklyTrendMetric>("mu")
  const heatmap = useMemo(() => getWeeklyHeatmap(metric), [metric])
  const cumulative = useMemo(() => getWeeklyCumulative(region), [region])
  const totalTrend = useMemo(() => getWeeklyTrend("Total", null, "mu"), [])
  const vendorTrend = useMemo(
    () =>
      getWeeklyTrend(region, weeklyVendors.indexOf(trendVendor), trendMetric),
    [region, trendMetric, trendVendor]
  )
  const chartData = cumulative.years.map((year) => ({
    year: String(year.year),
    total: year.total,
    ...Object.fromEntries(
      year.segments.map((segment) => [segment.name, segment.value])
    ),
  }))

  return (
    <section
      className="grid grid-cols-[minmax(0,58fr)_minmax(0,42fr)] gap-4"
      aria-label="Weekly market analysis"
    >
      <Card className="min-w-0 border-border shadow-none" size="sm">
        <CardHeader className="flex flex-row items-start justify-between gap-4 border-b pb-3">
          <div>
            <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
              Weekly market mix
            </p>
            <CardTitle className="mt-1 text-xl font-semibold tracking-tight group-data-[size=sm]/card:text-xl">
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
          <div className="flex h-[388px] overflow-hidden border">
            <table
              className="h-full w-full border-collapse text-xs"
              aria-label="Vendor by region weekly heatmap"
            >
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Vendor</th>
                  {weeklyRegions.map((regionName) => (
                    <th
                      className="px-2 py-2 text-right font-medium"
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
                    <th className="px-3 py-2 text-left font-medium" scope="row">
                      {row.label}
                    </th>
                    {row.values.map((value, index) => (
                      <td
                        className={`px-2 py-2 text-right tabular-nums ${
                          value !== null && value < 0
                            ? "text-destructive"
                            : "text-foreground"
                        }`}
                        key={`${row.label}-${weeklyRegions[index]}`}
                      >
                        {formatMetric(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 shrink-0 border-t pt-3">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  Weekly trend
                </p>
                <h3 className="mt-1 text-sm font-semibold tracking-tight">
                  Total weekly sell-out
                </h3>
              </div>
              <p className="pt-1 text-xs text-muted-foreground">
                2023–2025 W1–W52 · 2026 W1–W32
              </p>
            </div>
            <div className="mb-2 flex items-center gap-3 text-xs text-muted-foreground">
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
              data={totalTrend}
              label="Weekly total sell-out trend"
              metric="mu"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="min-w-0 border-border shadow-none" size="sm">
        <CardHeader className="border-b pb-3">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Cumulative sell-out
          </p>
          <CardTitle className="mt-1 text-xl font-semibold tracking-tight group-data-[size=sm]/card:text-xl">
            4-year cumulative composition
          </CardTitle>
          <ToggleGroup
            aria-label="Cumulative context selector"
            className="mt-3 flex flex-wrap gap-1"
            onSelectionChange={(selection) => {
              const next = Array.from(selection)[0]
              if (isWeeklyRegion(next)) {
                setRegion(next)
              }
            }}
            selectedKeys={new Set([region])}
            selectionMode="single"
            size="sm"
            variant="outline"
          >
            {weeklyRegions.map((regionName) => (
              <ToggleGroupItem id={regionName} key={regionName}>
                {regionName}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_140px] gap-3">
            <ChartContainer
              className="h-[340px] w-full min-w-0"
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
                  axisLine={false}
                  dataKey="year"
                  tickLine={false}
                  tickMargin={8}
                />
                <YAxis hide />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  cursor={false}
                />
                {cumulative.segmentNames.map((segmentName, index) => (
                  <Bar
                    dataKey={segmentName}
                    fill={`var(--color-${segmentName})`}
                    isAnimationActive={false}
                    key={segmentName}
                    stackId="weekly"
                  >
                    <LabelList
                      dataKey={segmentName}
                      fill={
                        index === 0 || index === 5
                          ? "var(--foreground)"
                          : "var(--primary-foreground)"
                      }
                      fontSize={9}
                      formatter={(value) => Number(value).toFixed(1)}
                      position="center"
                    />
                    {index === cumulative.segmentNames.length - 1 ? (
                      <LabelList
                        dataKey="total"
                        fill="var(--foreground)"
                        fontSize={10}
                        formatter={(value) => `${Number(value).toFixed(1)}Mu`}
                        position="top"
                      />
                    ) : null}
                  </Bar>
                ))}
              </BarChart>
            </ChartContainer>
            <ul
              aria-label="Cumulative composition legend"
              className="flex flex-col gap-1.5 pt-1 text-sm leading-5 text-muted-foreground"
            >
              {cumulative.years[0].segments.map((segment) => (
                <li className="flex items-center gap-1.5" key={segment.name}>
                  <i
                    aria-hidden="true"
                    className="size-1.5 shrink-0"
                    style={{ backgroundColor: segment.color }}
                  />
                  {segment.name}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-4 border-t pt-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  Weekly trend
                </p>
                <h3 className="mt-1 text-sm font-semibold tracking-tight">
                  {region} · {trendVendor} weekly sell-out
                </h3>
              </div>
              <p className="pt-1 text-xs text-muted-foreground">
                2023–2025 W1–W52 · 2026 W1–W32
              </p>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <ToggleGroup
                aria-label="Trend vendor selector"
                className="flex flex-wrap gap-1"
                onSelectionChange={(selection) => {
                  const next = Array.from(selection)[0]
                  if (isWeeklyVendor(next)) {
                    setTrendVendor(next)
                  }
                }}
                selectedKeys={new Set([trendVendor])}
                selectionMode="single"
                size="sm"
                variant="outline"
              >
                {weeklyVendors.map((vendor) => (
                  <ToggleGroupItem id={vendor} key={vendor}>
                    {vendor}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <ToggleGroup
                aria-label="Trend unit selector"
                onSelectionChange={(selection) => {
                  const next = Array.from(selection)[0]
                  if (next === "mu" || next === "share") {
                    setTrendMetric(next)
                  }
                }}
                selectedKeys={new Set([trendMetric])}
                selectionMode="single"
                size="sm"
                variant="outline"
              >
                <ToggleGroupItem id="mu">Mu</ToggleGroupItem>
                <ToggleGroupItem id="share">M/S (%)</ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
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
              data={vendorTrend}
              label="Weekly vendor trend"
              metric={trendMetric}
            />
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
