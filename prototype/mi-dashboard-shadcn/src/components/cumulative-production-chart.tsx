import { type Key, useMemo, useState } from "react"
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip"
import {
  cumulativeProduction,
  dashboardMeta,
  getForecastHistory,
  getProductionTotal,
  vendors,
  type VendorKey,
} from "@/data/production"

const chartConfig = Object.fromEntries(
  vendors.map((vendor) => [
    vendor.key,
    { label: vendor.label, color: vendor.color },
  ])
) satisfies ChartConfig

const allVendorKeys = vendors.map((vendor) => vendor.key)

type ChartSelection = {
  quarter: string
  vendor: VendorKey
}

const defaultSelection: ChartSelection = {
  quarter: dashboardMeta.focusQuarter,
  vendor: "transsion",
}

export function CumulativeProductionChart() {
  const [visibleVendors, setVisibleVendors] = useState<Set<VendorKey>>(
    () => new Set(allVendorKeys)
  )
  const [selection, setSelection] = useState<ChartSelection>(defaultSelection)
  const history = useMemo(
    () => getForecastHistory(selection.quarter),
    [selection.quarter]
  )
  const selectedQuarter = cumulativeProduction.find(
    (item) => item.quarter === selection.quarter
  )!
  const selectedVendor = vendors.find(
    (vendor) => vendor.key === selection.vendor
  )!

  const updateSelection = (selection: Set<Key>) => {
    const nextSelection = new Set(selection) as Set<VendorKey>
    setVisibleVendors(
      nextSelection.size ? nextSelection : new Set(allVendorKeys)
    )
  }

  return (
    <Card className="border-border shadow-none" id="overview">
      <CardHeader className="flex flex-row items-start justify-between gap-8 border-b pb-5">
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
      <CardContent className="pt-5">
        <div className="mb-5 flex items-start justify-between gap-6">
          <ToggleGroup
            aria-label="업체 필터"
            className="flex flex-wrap gap-2"
            onSelectionChange={updateSelection}
            selectedKeys={visibleVendors}
            selectionMode="multiple"
            size="sm"
            variant="outline"
          >
            {vendors.map((vendor) => (
              <TooltipTrigger key={vendor.key}>
                <ToggleGroupItem id={vendor.key}>
                  <span
                    aria-hidden="true"
                    className="size-2"
                    style={{ backgroundColor: vendor.color }}
                  />
                  {vendor.label}
                </ToggleGroupItem>
                <Tooltip>{vendor.label} 표시 또는 숨기기</Tooltip>
              </TooltipTrigger>
            ))}
          </ToggleGroup>
          <p className="pt-1 text-right text-xs leading-5 text-muted-foreground">
            {vendors.length}개 중 {visibleVendors.size}개 업체 표시
          </p>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-0 border-t pt-5">
          <section
            className="min-w-0 pe-6"
            aria-labelledby="production-chart-title"
          >
            <div className="mb-3 flex h-16 items-center justify-between gap-4">
              <p id="production-chart-title" className="text-sm font-medium">
                업체별 누적 생산량
              </p>
              <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
                <MousePointerClick aria-hidden="true" className="size-3.5" />
                막대를 클릭해 전망 변화 확인
              </p>
            </div>
            <ChartContainer className="h-[430px] w-full" config={chartConfig}>
              <BarChart
                accessibilityLayer
                barCategoryGap="8%"
                data={cumulativeProduction}
                margin={{ top: 12, right: 8, left: 10, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  axisLine={false}
                  dataKey="quarter"
                  fontSize={9}
                  interval={0}
                  tickLine={false}
                  tickMargin={10}
                />
                <YAxis
                  axisLine={false}
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
                    hide={!visibleVendors.has(vendor.key)}
                    isAnimationActive={false}
                    key={vendor.key}
                    onClick={(item) =>
                      setSelection({
                        quarter: item.payload.quarter,
                        vendor: vendor.key,
                      })
                    }
                    stackId="production"
                  >
                    {cumulativeProduction.map((item) => (
                      <Cell
                        className="cursor-pointer transition-[filter,stroke] hover:stroke-foreground hover:stroke-2 hover:brightness-90"
                        key={`${vendor.key}-${item.quarter}`}
                        stroke={
                          selection.quarter === item.quarter &&
                          selection.vendor === vendor.key
                            ? "var(--foreground)"
                            : "transparent"
                        }
                        strokeWidth={2}
                      />
                    ))}
                    <LabelList
                      dataKey={vendor.key}
                      formatter={(value) => Number(value).toFixed(1)}
                      fill={
                        vendorIndex === 0 || vendorIndex === 5
                          ? "var(--foreground)"
                          : "var(--primary-foreground)"
                      }
                      fontSize={9}
                      fontWeight={600}
                      position="center"
                    />
                  </Bar>
                ))}
              </BarChart>
            </ChartContainer>
          </section>

          <aside className="border-s ps-6" aria-labelledby="history-title">
            <div className="mb-3 h-16">
              <p className="text-xs font-medium tracking-[0.14em] text-primary uppercase">
                Forecast History
              </p>
              <div className="mt-1 flex items-end justify-between gap-3">
                <div>
                  <h3 id="history-title" className="text-base font-semibold">
                    {selection.quarter} 전망 변화
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    선택: {selectedVendor.label}{" "}
                    {selectedQuarter[selection.vendor].toFixed(1)}Mu
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold">
                  {getProductionTotal(selectedQuarter).toFixed(1)}Mu
                </p>
              </div>
            </div>
            <ChartContainer className="h-[430px] w-full" config={chartConfig}>
              <BarChart
                accessibilityLayer
                barCategoryGap="8%"
                data={history}
                margin={{ top: 12, right: 2, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  axisLine={false}
                  dataKey="period"
                  fontSize={9}
                  interval={0}
                  tickLine={false}
                  tickMargin={10}
                />
                <YAxis hide />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  cursor={false}
                />
                {vendors.map((vendor, vendorIndex) => (
                  <Bar
                    dataKey={vendor.key}
                    fill={`var(--color-${vendor.key})`}
                    isAnimationActive={false}
                    key={vendor.key}
                    stackId="history"
                  >
                    <LabelList
                      dataKey={vendor.key}
                      formatter={(value) => Number(value).toFixed(1)}
                      fill={
                        vendorIndex === 0 || vendorIndex === 5
                          ? "var(--foreground)"
                          : "var(--primary-foreground)"
                      }
                      fontSize={8}
                      position="center"
                    />
                  </Bar>
                ))}
              </BarChart>
            </ChartContainer>
          </aside>
        </div>
      </CardContent>
    </Card>
  )
}
