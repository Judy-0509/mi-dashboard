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
  cumulativeProduction,
  dashboardMeta,
  getForecastHistory,
  getProductionTotal,
  getVendorHistoryDeltas,
  getVisibleVendorTotal,
  productionYAxisDomain,
  vendors,
  type VendorKey,
} from "@/data/production"
import type { VendorValue } from "@/data/vendor-catalog"

const chartConfig = Object.fromEntries(
  vendors.map((vendor) => [
    vendor.key,
    { label: vendor.label, color: vendor.color },
  ])
) satisfies ChartConfig

const allVendorKeys = vendors
  .filter((vendor) => vendor.availability === "available")
  .map((vendor) => vendor.key)

function toChartValue(value: VendorValue<number>) {
  return value.status === "available" ? value.value : null
}

function formatChartValue(value: unknown) {
  return value === null || value === undefined ? "—" : Number(value).toFixed(1)
}

function formatSignedMu(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}Mu`
}

export function CumulativeProductionChart() {
  const [visibleVendors, setVisibleVendors] = useState<Set<VendorKey>>(
    () => new Set(allVendorKeys)
  )
  const [selectedQuarter, setSelectedQuarter] = useState(
    dashboardMeta.focusQuarter
  )
  const [hoveredQuarter, setHoveredQuarter] = useState<string | null>(null)
  const history = useMemo(
    () => getForecastHistory(selectedQuarter),
    [selectedQuarter]
  )
  const visibleVendorKeys = vendors
    .filter((vendor) => visibleVendors.has(vendor.key))
    .map((vendor) => vendor.key)
  const topVisibleVendorKey = visibleVendorKeys.at(-1)
  const productionWithVisibleTotals = cumulativeProduction.map((item) => ({
    quarter: item.quarter,
    ...Object.fromEntries(
      vendors.map((vendor) => [vendor.key, toChartValue(item[vendor.key])]),
    ),
    visibleTotal: getVisibleVendorTotal(item, visibleVendorKeys),
  }))
  const historyWithTotals = useMemo(
    () =>
      history.map((item) => ({
        period: item.period,
        ...Object.fromEntries(
          vendors.map((vendor) => [vendor.key, toChartValue(item[vendor.key])]),
        ),
        total: getProductionTotal(item),
      })),
    [history]
  )
  const historyDeltas = useMemo(
    () => getVendorHistoryDeltas(history),
    [history]
  )

  const toggleVendor = (vendorKey: VendorKey) => {
    setVisibleVendors((current) => {
      const next = new Set(current)

      if (
        vendors.find((vendor) => vendor.key === vendorKey)?.availability !==
        "available"
      ) {
        return current
      }

      if (next.has(vendorKey)) {
        if (next.size > 1) {
          next.delete(vendorKey)
        }
      } else {
        next.add(vendorKey)
      }

      return next
    })
  }

  return (
    <Card className="border-border shadow-none" id="overview" size="sm">
      <CardHeader className="flex flex-row items-start justify-between gap-8 border-b pb-3">
        <div>
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Forecast
          </p>
          <CardTitle className="mt-1 text-xl font-semibold tracking-tight">
            {dashboardMeta.firstQuarter}–{dashboardMeta.lastQuarter} 분기 누적
            생산량
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            단위: Mu / 분기 누적
          </p>
        </div>
        <Button
          className="shrink-0"
          onPress={() => setVisibleVendors(new Set(allVendorKeys))}
          size="sm"
          variant="outline"
        >
          필터 초기화
        </Button>
      </CardHeader>
      <CardContent className="pt-3">
        <div className="mb-3 flex items-start justify-between gap-6">
          <div
            aria-label="업체 필터"
            className="flex flex-wrap gap-2"
            role="group"
          >
            {vendors.map((vendor) => {
              const unavailable = vendor.availability === "unavailable"
              return (
              <div className="flex" key={vendor.key}>
                <Button
                  aria-pressed={visibleVendors.has(vendor.key)}
                  className="h-7 gap-1.5 px-2 text-xs"
                  isDisabled={unavailable}
                  onPress={() => toggleVendor(vendor.key)}
                  size="sm"
                  variant={
                    visibleVendors.has(vendor.key) ? "secondary" : "outline"
                  }
                >
                  <span
                    aria-hidden="true"
                    className="size-2"
                    style={{ backgroundColor: vendor.color }}
                  />
                  {vendor.label}
                  {unavailable ? (
                    <span aria-label="데이터 없음" className="ms-0.5">
                      —<span className="sr-only">데이터 없음</span>
                    </span>
                  ) : null}
                </Button>
                <Button
                  aria-label={`${vendor.label}만 표시`}
                  className="h-7 px-2 text-[10px] font-semibold tracking-wide"
                  isDisabled={unavailable}
                  onPress={() => setVisibleVendors(new Set([vendor.key]))}
                  size="sm"
                  variant="outline"
                >
                  ONLY
                </Button>
              </div>
              )
            })}
          </div>
          <p className="pt-1 text-right text-xs leading-5 text-muted-foreground">
            {vendors.length}개 중 {visibleVendors.size}개 업체 표시
          </p>
        </div>
        <div className="grid grid-cols-[minmax(0,58fr)_minmax(0,42fr)] gap-0 border-t pt-3">
          <section
            className="min-w-0 pe-6"
            aria-labelledby="production-chart-title"
          >
            <div className="mb-2 flex h-11 items-center justify-between gap-4">
              <p id="production-chart-title" className="text-sm font-medium">
                업체별 누적 생산량
              </p>
              <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
                <MousePointerClick aria-hidden="true" className="size-3.5" />
                막대를 클릭해 전망 변화 확인
              </p>
            </div>
            <ChartContainer className="h-[330px] w-full" config={chartConfig}>
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
                    typeof activeLabel === "string" ? activeLabel : null
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
                  domain={productionYAxisDomain}
                  tickFormatter={(value) => `${value}m`}
                  tickLine={false}
                  tickMargin={8}
                  width={48}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  cursor={false}
                />
                {vendors.map((vendor, vendorIndex) => (
                  <Bar
                    className="cursor-pointer"
                    dataKey={vendor.key}
                    fill={`var(--color-${vendor.key})`}
                    hide={
                      vendor.availability === "unavailable" ||
                      !visibleVendors.has(vendor.key)
                    }
                    isAnimationActive={false}
                    key={vendor.key}
                    stackId="production"
                  >
                    {cumulativeProduction.map((item) => (
                      <Cell
                        className="cursor-pointer transition-opacity"
                        fillOpacity={
                          hoveredQuarter && hoveredQuarter !== item.quarter
                            ? 0.25
                            : 1
                        }
                        key={`${vendor.key}-${item.quarter}`}
                      />
                    ))}
                    <LabelList
                      dataKey={vendor.key}
                      formatter={formatChartValue}
                      fill={
                        vendorIndex === 0 || vendorIndex === 5
                          ? "var(--foreground)"
                          : "var(--primary-foreground)"
                      }
                      fontSize={9}
                      fontWeight={600}
                      position="center"
                    />
                    {vendor.key === topVisibleVendorKey ? (
                      <LabelList
                        dataKey="visibleTotal"
                        formatter={(value) =>
                          value === null || value === undefined
                            ? "—"
                            : `${Number(value).toFixed(1)}Mu`
                        }
                        fill="var(--foreground)"
                        fontSize={9}
                        fontWeight={600}
                        offset={8}
                        position="top"
                      />
                    ) : null}
                  </Bar>
                ))}
              </BarChart>
            </ChartContainer>
          </section>

          <aside className="border-s ps-6" aria-labelledby="history-title">
            <div className="mb-2 h-11">
              <p className="text-xs font-medium tracking-[0.14em] text-primary uppercase">
                Forecast History
              </p>
              <h3 id="history-title" className="mt-1 text-base font-semibold">
                {selectedQuarter} 전망 변화
              </h3>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_140px] gap-2">
              <ChartContainer
                className="h-[330px] w-full min-w-0"
                config={chartConfig}
              >
                <BarChart
                  accessibilityLayer
                  barCategoryGap="8%"
                  data={historyWithTotals}
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
                  <YAxis domain={productionYAxisDomain} hide />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    cursor={false}
                  />
                  {vendors.map((vendor, vendorIndex) => (
                    <Bar
                      dataKey={vendor.key}
                      fill={`var(--color-${vendor.key})`}
                      hide={vendor.availability === "unavailable"}
                      isAnimationActive={false}
                      key={vendor.key}
                      stackId="history"
                    >
                      <LabelList
                        dataKey={vendor.key}
                        formatter={formatChartValue}
                        fill={
                          vendorIndex === 0 || vendorIndex === 5
                            ? "var(--foreground)"
                            : "var(--primary-foreground)"
                        }
                        fontSize={8}
                        position="center"
                      />
                      {vendorIndex === vendors.length - 1 ? (
                        <LabelList
                          dataKey="total"
                          formatter={(value) =>
                            value === null || value === undefined
                              ? "—"
                              : `${Number(value).toFixed(1)}Mu`
                          }
                          fill="var(--foreground)"
                          fontSize={8}
                          fontWeight={600}
                          offset={8}
                          position="top"
                        />
                      ) : null}
                    </Bar>
                  ))}
                </BarChart>
              </ChartContainer>
              <div
                aria-label="업체별 전망 변화"
                className="pt-5 text-sm leading-5"
              >
                <p className="mb-2 font-medium text-foreground">
                  {history.at(-1)?.period} vs {history.at(-2)?.period} 업체별
                  증감
                </p>
                <div className="space-y-1.5">
                  {vendors.map((vendor) => {
                    const delta = historyDeltas[vendor.key]
                    const deltaClassName =
                      delta === null
                        ? "text-muted-foreground"
                        : delta > 0
                        ? "text-primary"
                        : delta < 0
                          ? "text-destructive"
                          : "text-muted-foreground"

                    return (
                      <div className="flex items-center gap-1" key={vendor.key}>
                        <span
                          aria-hidden="true"
                          className="size-1.5 shrink-0"
                          style={{ backgroundColor: vendor.color }}
                        />
                        <span className="min-w-0 flex-1 text-foreground">
                          {vendor.label}
                        </span>
                        <span
                          className={`shrink-0 font-medium ${deltaClassName}`}
                        >
                          {delta === null ? "—" : formatSignedMu(delta)}
                          {delta === null ? (
                            <span className="sr-only">데이터 없음</span>
                          ) : null}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </CardContent>
    </Card>
  )
}
