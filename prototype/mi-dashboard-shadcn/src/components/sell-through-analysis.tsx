import { Fragment, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
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
  getSellThroughTotals,
  inventorySnapshots,
  sellThroughMonthly,
  sellThroughVendors,
} from "@/data/sell-through"
import type { VendorValue } from "@/data/vendor-catalog"

type SellThroughView = "vendor" | "total"

type SellThroughChartPoint = {
  month: string
  label: string
  ratio: number | null
  sellInTotal: number | null
  sellThroughTotal: number | null
  [key: string]: number | string | null
}

const viewOptions = [{ key: "vendor", label: "Vendor" }, { key: "total", label: "Total" }] as const
const inventoryPeriods = ["25년 말", "26년 4월", "26년 8월"] as const
const ratioColor = "#d97706"

const chartConfig: ChartConfig = {
  ratio: { label: "SI/ST Ratio(%)", color: ratioColor },
  sellInTotal: { label: "SI total", color: "var(--chart-1)" },
  sellThroughTotal: { label: "ST total", color: "var(--chart-2)" },
  ...Object.fromEntries(
    sellThroughVendors.flatMap(({ key, label, color }) => [
      [`si_${key}`, { label: `SI · ${label}`, color }],
      [`st_${key}`, { label: `ST · ${label}`, color }],
    ])
  ),
}

function formatMonth(month: string) {
  return `${month.slice(2, 4)}년 ${Number(month.slice(5))}월`
}

function formatBarTotal(value: unknown) {
  return value === null || value === undefined ? "—" : Number(value).toFixed(0)
}

function formatRatio(value: unknown) {
  return value === null || value === undefined
    ? "N/A"
    : `${Number(value).toFixed(1)}%`
}

const sellThroughChartData: SellThroughChartPoint[] = sellThroughMonthly.map(
  (point) => {
    const totals = getSellThroughTotals(point)
    const vendorValues = Object.fromEntries(
      sellThroughVendors.flatMap(({ key }) => [
        [
          `si_${key}`,
          point.sellIn[key].status === "available"
            ? point.sellIn[key].value
            : null,
        ],
        [
          `st_${key}`,
          point.sellThrough[key].status === "available"
            ? point.sellThrough[key].value
            : null,
        ],
      ])
    )

    return {
      month: point.month,
      label: formatMonth(point.month),
      ratio: totals.ratio,
      sellInTotal: totals.sellIn,
      sellThroughTotal: totals.sellThrough,
      ...vendorValues,
    }
  }
)

function SellThroughTooltip({ view }: { view: SellThroughView }) {
  return (
    <ChartTooltip
      content={(props) => {
        const point = props.payload?.[0]?.payload as
          | SellThroughChartPoint
          | undefined
        const firstPayload = props.payload?.[0]
        const totalPayload =
          view === "vendor" && point && firstPayload
            ? [
                {
                  ...firstPayload,
                  color: "var(--chart-1)",
                  dataKey: "sellInTotal",
                  name: "SI total",
                  value: point.sellInTotal ?? undefined,
                },
                {
                  ...firstPayload,
                  color: "var(--chart-2)",
                  dataKey: "sellThroughTotal",
                  name: "ST total",
                  value: point.sellThroughTotal ?? undefined,
                },
              ]
            : []

        return (
          <ChartTooltipContent
            {...props}
            content={undefined}
            payload={
              totalPayload.length
                ? [...(props.payload ?? []), ...totalPayload]
                : props.payload
            }
          />
        )
      }}
      cursor={false}
    />
  )
}

function SellThroughChart({ view }: { view: SellThroughView }) {
  return (
    <ChartContainer
      aria-label="Monthly Sell-in and Sell-through by vendor"
      className="h-[360px] w-full min-w-0"
      config={chartConfig}
    >
      <BarChart
        accessibilityLayer
        barCategoryGap="18%"
        data={sellThroughChartData}
        margin={{ top: 28, right: 8, left: 4, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          axisLine={false}
          dataKey="label"
          fontSize={9}
          interval={0}
          tickLine={false}
          tickMargin={7}
        />
        <YAxis
          axisLine={false}
          domain={[0, 500]}
          tickFormatter={(value) => Number(value).toFixed(0)}
          tickLine={false}
          tickMargin={7}
          width={32}
          yAxisId="bars"
        />
        <YAxis
          axisLine={false}
          domain={[90, 110]}
          orientation="right"
          tickFormatter={(value) => `${Number(value).toFixed(0)}%`}
          tickLine={false}
          tickMargin={7}
          width={38}
          yAxisId="ratio"
        />
        <SellThroughTooltip view={view} />
        {view === "vendor" ? (
          sellThroughVendors.map((vendor, index) => (
            <Fragment key={vendor.key}>
              <Bar
                dataKey={`si_${vendor.key}`}
                fill={vendor.color}
                hide={vendor.availability === "unavailable"}
                isAnimationActive={false}
                name={`SI · ${vendor.label}`}
                stackId="sell-in"
                yAxisId="bars"
              >
                <LabelList
                  dataKey={`si_${vendor.key}`}
                  fill={index < 3 ? "var(--foreground)" : "var(--background)"}
                  fontSize={8}
                  formatter={formatBarTotal}
                  position="center"
                />
                {index === sellThroughVendors.length - 1 ? (
                  <LabelList
                    dataKey="sellInTotal"
                    fill="var(--foreground)"
                    fontSize={9}
                    formatter={formatBarTotal}
                    position="top"
                  />
                ) : null}
              </Bar>
              <Bar
                dataKey={`st_${vendor.key}`}
                fill={vendor.color}
                fillOpacity={0.55}
                hide={vendor.availability === "unavailable"}
                isAnimationActive={false}
                name={`ST · ${vendor.label}`}
                stackId="sell-through"
                yAxisId="bars"
              >
                <LabelList
                  dataKey={`st_${vendor.key}`}
                  fill={index < 3 ? "var(--foreground)" : "var(--background)"}
                  fontSize={8}
                  formatter={formatBarTotal}
                  position="center"
                />
                {index === sellThroughVendors.length - 1 ? (
                  <LabelList
                    dataKey="sellThroughTotal"
                    fill="var(--foreground)"
                    fontSize={9}
                    formatter={formatBarTotal}
                    position="top"
                  />
                ) : null}
              </Bar>
            </Fragment>
          ))
        ) : (
          <>
            <Bar
              dataKey="sellInTotal"
              fill="var(--chart-1)"
              isAnimationActive={false}
              name="SI total"
              yAxisId="bars"
            >
              <LabelList
                dataKey="sellInTotal"
                fill="var(--foreground)"
                fontSize={9}
                formatter={formatBarTotal}
                position="top"
              />
            </Bar>
            <Bar
              dataKey="sellThroughTotal"
              fill="var(--chart-2)"
              isAnimationActive={false}
              name="ST total"
              yAxisId="bars"
            >
              <LabelList
                dataKey="sellThroughTotal"
                fill="var(--foreground)"
                fontSize={9}
                formatter={formatBarTotal}
                position="top"
              />
            </Bar>
          </>
        )}
        <Line
          activeDot={{ r: 4 }}
          connectNulls={false}
          dataKey="ratio"
          dot={{ fill: ratioColor, r: 3, stroke: ratioColor }}
          isAnimationActive={false}
          name="SI/ST Ratio(%)"
          stroke={ratioColor}
          strokeWidth={2}
          type="monotone"
          yAxisId="ratio"
        >
          <LabelList
            dataKey="ratio"
            fill={ratioColor}
            fontSize={9}
            formatter={formatRatio}
            position="top"
          />
        </Line>
      </BarChart>
    </ChartContainer>
  )
}

function InventoryTable() {
  function formatVendorValue(value: VendorValue<number>) {
    return value.status === "available" ? value.value : "—"
  }

  return (
    <div className="min-w-0 overflow-hidden border">
      <table
        aria-label="Inventory and WoS vendor snapshots"
        className="w-full table-fixed border-collapse text-xs"
      >
        <caption className="sr-only">Inventory and WoS vendor snapshots</caption>
        <colgroup>
          <col className="w-[22%]" />
          <col span={6} />
        </colgroup>
        <thead className="bg-muted/40 text-muted-foreground">
          <tr>
            <th className="border-b px-3 py-1.5 text-left font-medium" rowSpan={2} scope="col">
              Vendor
            </th>
            <th className="border-b px-2 py-1.5 text-center font-medium" colSpan={3} scope="colgroup">
              Inventory
            </th>
            <th className="border-b px-2 py-1.5 text-center font-medium" colSpan={3} scope="colgroup">
              WoS
            </th>
          </tr>
          <tr>
            {inventoryPeriods.map((period) => (
              <th className="px-2 py-1.5 text-right font-medium" key={`inventory-${period}`} scope="col">
                {period}
              </th>
            ))}
            {inventoryPeriods.map((period) => (
              <th className="px-2 py-1.5 text-right font-medium" key={`wos-${period}`} scope="col">
                {period}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {inventorySnapshots.map((row) => {
            const vendor = sellThroughVendors.find(({ key }) => key === row.vendor)

            return (
              <tr className="border-t" key={row.vendor}>
                <th className="px-3 py-1.5 text-left font-medium" scope="row">
                  <span className="inline-flex items-center gap-1.5">
                    <i
                      aria-hidden="true"
                      className="size-1.5 shrink-0"
                      style={{ backgroundColor: vendor?.color }}
                    />
                    {vendor?.label ?? row.vendor}
                  </span>
                </th>
                {row.inventory.map((value, index) => (
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums" key={`inventory-${index}`}>
                    <span aria-label={value.status === "available" ? undefined : "데이터 없음"}>
                      {formatVendorValue(value)}
                      {value.status === "unavailable" ? (
                        <span className="sr-only">데이터 없음</span>
                      ) : null}
                    </span>
                  </td>
                ))}
                {row.wos.map((value, index) => (
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums" key={`wos-${index}`}>
                    <span aria-label={value.status === "available" ? undefined : "데이터 없음"}>
                      {formatVendorValue(value)}
                      {value.status === "unavailable" ? (
                        <span className="sr-only">데이터 없음</span>
                      ) : null}
                    </span>
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function SellThroughLegend({ view }: { view: SellThroughView }) {
  return view === "vendor" ? (
    <ul aria-label="Vendor legend" className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {sellThroughVendors.map(({ label, color, availability }) => (
        <li className="flex items-center gap-1.5" key={label}>
          <i aria-hidden="true" className="size-1.5 shrink-0" style={{ backgroundColor: color }} />
          {label}
          {availability === "unavailable" ? (
            <span aria-label="데이터 없음">
              —<span className="sr-only">데이터 없음</span>
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  ) : (
    <ul aria-label="Sell-in / Sell-through legend" className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <li className="flex items-center gap-1.5">
        <i aria-hidden="true" className="size-1.5 shrink-0" style={{ backgroundColor: "var(--chart-1)" }} />
        Sell-in
      </li>
      <li className="flex items-center gap-1.5">
        <i aria-hidden="true" className="size-1.5 shrink-0" style={{ backgroundColor: "var(--chart-2)" }} />
        Sell-through
      </li>
    </ul>
  )
}

export function SellThroughAnalysis(): React.JSX.Element {
  const [view, setView] = useState<SellThroughView>("total")

  return (
    <section
      aria-label="Sell-in and Sell-through market analysis"
      className="mt-4 grid min-w-0 grid-cols-[minmax(0,58fr)_minmax(0,42fr)] items-stretch gap-4"
    >
      <Card className="h-full min-w-0 border-border shadow-none" size="sm">
        <CardHeader className="flex flex-row items-start justify-between gap-4 border-b pb-3">
          <div>
            <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
              Monthly flow
            </p>
            <CardTitle className="mt-1 text-xl font-semibold tracking-tight group-data-[size=sm]/card:text-xl">
              Sell-in / Sell-through
            </CardTitle>
          </div>
          <ToggleGroup
            aria-label="Sell-in / Sell-through view"
            onSelectionChange={(selection) => {
              const next = Array.from(selection)[0]
              if (next === "vendor" || next === "total") {
                setView(next)
              }
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
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              SI / ST monthly comparison · ratio = SI ÷ ST
            </p>
            <p className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
              <i aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: ratioColor }} />
              SI/ST Ratio(%)
            </p>
          </div>
          <SellThroughChart view={view} />
          <SellThroughLegend view={view} />
        </CardContent>
      </Card>

      <Card className="h-full min-w-0 border-border shadow-none" size="sm">
        <CardHeader className="border-b pb-3">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Vendor snapshots
          </p>
          <CardTitle className="mt-1 text-xl font-semibold tracking-tight group-data-[size=sm]/card:text-xl">
            Inventory
          </CardTitle>
        </CardHeader>
        <CardContent className="min-w-0 pt-3">
          <InventoryTable />
        </CardContent>
      </Card>
    </section>
  )
}
