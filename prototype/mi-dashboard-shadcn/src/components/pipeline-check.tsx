import type * as React from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getPipelineChartData,
  pipelineData,
  pipelineExecutiveSummary,
  pipelineQuarters,
  pipelineVendors,
  pipelineYAxisDomain,
  pipelineYAxisTicks,
  type PipelineFlowMetric,
  type PipelineInventoryMetric,
} from "@/data/pipeline-check"

const pipelineChartConfig = Object.fromEntries(
  pipelineVendors.map((vendor) => [
    vendor.key,
    { label: vendor.label, color: vendor.color },
  ]),
) satisfies ChartConfig

export type PipelineStackedChartProps = {
  metric: PipelineFlowMetric
  title: "Production" | "Sell-in" | "Sell-out"
}

export type PipelineInventoryTableProps = {
  metric: PipelineInventoryMetric
  title: "Production Inventory" | "Channel Inventory"
}

function PipelineStackedChart({
  metric,
  title,
}: PipelineStackedChartProps) {
  const chartData = getPipelineChartData(metric)
  const titleId = `pipeline-${metric}-title`

  return (
    <section aria-labelledby={titleId} className="min-w-0">
      <h3 className="mb-2 text-sm font-medium" id={titleId}>
        {title}
      </h3>
      <ChartContainer
        aria-labelledby={titleId}
        className="h-[300px] w-full min-w-0"
        config={pipelineChartConfig}
      >
        <BarChart
          accessibilityLayer
          barCategoryGap="10%"
          data={chartData}
          margin={{ top: 24, right: 2, left: 0, bottom: 4 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="quarter"
            fontSize={8}
            interval={0}
            tickLine={false}
            tickMargin={4}
          />
          <YAxis
            axisLine={false}
            fontSize={8}
            domain={pipelineYAxisDomain}
            tickFormatter={(value) => `${value}m`}
            ticks={pipelineYAxisTicks}
            tickLine={false}
            tickMargin={4}
            width={30}
          />
          <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
          {pipelineVendors.map((vendor) => (
            <Bar
              dataKey={vendor.key}
              fill={vendor.color}
              isAnimationActive={false}
              key={vendor.key}
              stackId="pipeline"
            >
              <LabelList
                dataKey={vendor.key}
                fill="var(--foreground)"
                fontSize={8}
                formatter={(value) => Number(value).toFixed(1)}
                position="center"
              />
              {vendor.key === "cnOem" ? (
                <LabelList
                  dataKey="total"
                  fill="var(--foreground)"
                  fontSize={8}
                  fontWeight={600}
                  formatter={(value) => `${Number(value).toFixed(1)}Mu`}
                  offset={8}
                  position="top"
                />
              ) : null}
            </Bar>
          ))}
        </BarChart>
      </ChartContainer>
    </section>
  )
}

function PipelineInventoryTable({
  metric,
  title,
}: PipelineInventoryTableProps) {
  const titleId = `pipeline-${metric}-title`

  return (
    <section aria-labelledby={titleId} className="min-w-0">
      <h3 className="mb-2 text-sm font-medium" id={titleId}>
        {title}
      </h3>
      <table
        aria-labelledby={titleId}
        className="h-[300px] w-full table-fixed border-collapse text-[8px] tabular-nums"
      >
        <caption className="sr-only">{title} · 단위 Mu</caption>
        <colgroup>
          <col className="w-[48px]" />
          {pipelineQuarters.map((quarter) => (
            <col key={quarter} />
          ))}
        </colgroup>
        <thead className="bg-muted/40 text-muted-foreground">
          <tr>
            <th className="border px-1 py-1 text-left font-medium" scope="col">
              Vendor
            </th>
            {pipelineQuarters.map((quarter) => (
              <th
                className="border px-1 py-1 text-center font-medium"
                key={quarter}
                scope="col"
              >
                {quarter}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pipelineVendors.map((vendor) => (
            <tr key={vendor.key}>
              <th
                className="border px-1 py-1 text-left font-medium text-foreground"
                scope="row"
              >
                {vendor.label}
              </th>
              {pipelineData.map((row) => {
                const value = row[metric][vendor.key]
                return (
                  <td className="border px-1 py-1 text-right" key={row.quarter}>
                    {value === null ? "N/A" : `${value.toFixed(1)}Mu`}
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

export function PipelineCheck(): React.ReactElement {
  return (
    <>
      <Card className="my-4 border-border shadow-none" size="sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold tracking-[0.14em] uppercase">
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 text-sm leading-5 text-muted-foreground">
            {pipelineExecutiveSummary.map((observation) => (
              <li className="flex gap-3" key={observation}>
                <span
                  aria-hidden="true"
                  className="mt-2 size-1.5 shrink-0 bg-primary"
                />
                <span>{observation}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="min-w-0 border-border shadow-none" size="sm">
        <CardHeader className="flex flex-row items-start justify-between gap-4 border-b pb-3">
          <div>
            <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
              Pipeline Check
            </p>
            <CardTitle className="mt-1 text-xl font-semibold tracking-tight group-data-[size=sm]/card:text-xl">
              Production · Sell-in · Sell-out
            </CardTitle>
          </div>
          <ul
            aria-label="Pipeline Vendor legend"
            className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground"
          >
            {pipelineVendors.map((vendor) => (
              <li className="flex items-center gap-1.5" key={vendor.key}>
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0"
                  style={{ backgroundColor: vendor.color }}
                />
                <span>{vendor.label}</span>
              </li>
            ))}
          </ul>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_210px_minmax(0,1fr)_210px_minmax(0,1fr)] items-stretch gap-2">
            <PipelineStackedChart metric="production" title="Production" />
            <PipelineInventoryTable
              metric="productionInventory"
              title="Production Inventory"
            />
            <PipelineStackedChart metric="sellIn" title="Sell-in" />
            <PipelineInventoryTable
              metric="channelInventory"
              title="Channel Inventory"
            />
            <PipelineStackedChart metric="sellOut" title="Sell-out" />
          </div>
        </CardContent>
      </Card>
    </>
  )
}
