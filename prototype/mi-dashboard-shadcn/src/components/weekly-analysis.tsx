import { type Key, useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"

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

export function WeeklyAnalysis() {
  const [metric, setMetric] = useState<WeeklyMetric>("yoy")
  const [region, setRegion] = useState<WeeklyRegion>("Total")
  const heatmap = useMemo(() => getWeeklyHeatmap(metric), [metric])
  const cumulative = useMemo(() => getWeeklyCumulative(region), [region])
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
            <CardTitle className="mt-1 group-data-[size=sm]/card:text-xl text-xl font-semibold tracking-tight">
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
        <CardContent className="flex flex-1 flex-col pt-3">
          <div className="flex flex-1 overflow-hidden border">
            <table className="h-full w-full border-collapse text-xs"
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
        </CardContent>
      </Card>

      <Card className="min-w-0 border-border shadow-none" size="sm">
        <CardHeader className="border-b pb-3">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Cumulative sell-out
          </p>
          <CardTitle className="mt-1 group-data-[size=sm]/card:text-xl text-xl font-semibold tracking-tight">
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
              className="h-[340px] min-w-0 w-full"
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
                <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
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
        </CardContent>
      </Card>
    </section>
  )
}
