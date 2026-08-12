import type * as React from "react"

import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"

import type { ForecastSnapshot } from "@/data/latest-results"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export type ForecastHistoryDisplay = {
  history: readonly ForecastSnapshot[]
  title: string
}

export type ForecastHistoryChartProps = {
  display: ForecastHistoryDisplay | null
}

const chartConfig = {
  value: { label: "Forecast", color: "var(--primary)" },
} satisfies ChartConfig

export function ForecastHistoryChart({
  display,
}: ForecastHistoryChartProps): React.ReactElement {
  if (!display) {
    return (
      <section
        aria-labelledby="forecast-history-title"
        className="min-w-0 overflow-hidden rounded-lg border bg-card px-5 py-4"
      >
        <h2 className="type-card-title" id="forecast-history-title">
          Forecast History
        </h2>
        <p className="type-control mt-2 text-muted-foreground">
          Forecast를 선택하면 월별 이력을 확인할 수 있습니다.
        </p>
      </section>
    )
  }

  const { history, title } = display
  const chartLabel = `${title}. 월별 Forecast 값: ${history
    .map(({ monthLabel, value }) => `${monthLabel} ${value.toFixed(1)}`)
    .join(", ")}`

  if (history.length === 0) {
    return (
      <section
        aria-labelledby="forecast-history-title"
        className="min-w-0 overflow-hidden rounded-lg border bg-card px-5 py-4"
      >
        <h2 className="type-card-title" id="forecast-history-title">
          {title}
        </h2>
        <p className="type-control mt-2 text-muted-foreground">
          Forecast 이력이 없습니다.
        </p>
      </section>
    )
  }

  return (
    <section
      aria-label={chartLabel}
      aria-labelledby="forecast-history-title"
      className="min-w-0 overflow-hidden rounded-lg border bg-card"
    >
      <div className="border-b px-5 py-4">
        <h2 className="type-card-title" id="forecast-history-title">
          {title}
        </h2>
        <p className="type-control mt-1 text-muted-foreground">
          월별 Forecast 변동 이력
        </p>
      </div>
      <div className="px-5 py-3">
        <ChartContainer
          aria-label={chartLabel}
          className="h-[300px] w-full min-w-0"
          config={chartConfig}
        >
          <LineChart
            accessibilityLayer
            data={history}
            margin={{ top: 12, right: 8, left: 0, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="monthLabel"
              fontSize={10}
              interval={0}
              tickLine={false}
              tickMargin={7}
            />
            <YAxis
              axisLine={false}
              domain={["dataMin - 1", "dataMax + 1"]}
              fontSize={10}
              tickLine={false}
              tickMargin={7}
              width={32}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              cursor={false}
            />
            <Line
              activeDot={{ r: 5 }}
              dataKey="value"
              dot={{ fill: "var(--primary)", r: 3 }}
              isAnimationActive={false}
              name="Forecast"
              stroke="var(--primary)"
              strokeWidth={2}
              type="monotone"
            />
          </LineChart>
        </ChartContainer>
      </div>
    </section>
  )
}
