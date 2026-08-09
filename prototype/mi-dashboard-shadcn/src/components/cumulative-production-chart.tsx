import { type Key, useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

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
  vendors,
  type VendorKey,
} from "@/data/production"

const chartConfig = Object.fromEntries(
  vendors.map((vendor) => [vendor.key, { label: vendor.label, color: vendor.color }])
) satisfies ChartConfig

const allVendorKeys = vendors.map((vendor) => vendor.key)

export function CumulativeProductionChart() {
  const [visibleVendors, setVisibleVendors] = useState<Set<VendorKey>>(
    () => new Set(allVendorKeys)
  )

  const updateSelection = (selection: Set<Key>) => {
    const nextSelection = new Set(selection) as Set<VendorKey>
    setVisibleVendors(nextSelection.size ? nextSelection : new Set(allVendorKeys))
  }

  return (
    <Card className="border-border shadow-none" id="overview">
      <CardHeader className="flex flex-row items-start justify-between gap-8 border-b pb-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Forecast
          </p>
          <CardTitle className="mt-1 text-xl font-semibold tracking-tight">
            2024 Q1–2027 Q2 분기 누적 생산량
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">단위: Mu / 분기 누적</p>
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
        <ChartContainer className="h-[410px] w-full" config={chartConfig}>
          <BarChart accessibilityLayer data={cumulativeProduction} margin={{ top: 8, right: 10, left: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis axisLine={false} dataKey="quarter" tickLine={false} tickMargin={10} />
            <YAxis axisLine={false} tickFormatter={(value) => `${value}m`} tickLine={false} tickMargin={8} width={48} />
            <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
            {vendors.map((vendor) => (
              <Bar
                dataKey={vendor.key}
                fill={`var(--color-${vendor.key})`}
                hide={!visibleVendors.has(vendor.key)}
                key={vendor.key}
                stackId="production"
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
