import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { miWeeklySellThroughDetails } from "@/data/mi-weekly-sell-through"
import {
  getWeeklyMetric,
  weeklyRegions,
  weeklySelectedWeek,
  type WeeklyRegion,
} from "@/data/weekly"

function formatMetric(value: number | null) {
  if (value === null) {
    return "N/A"
  }

  return `${value < 0 ? "△" : value > 0 ? "+" : ""}${Math.abs(value).toFixed(1)}%`
}
export function MiWeeklySellThroughSummary() {
  const rows = weeklyRegions.map((region: WeeklyRegion) => ({
    region,
    yoy: getWeeklyMetric(weeklySelectedWeek, region, null, "yoy"),
    wow: getWeeklyMetric(weeklySelectedWeek, region, null, "wow"),
    details: miWeeklySellThroughDetails[region],
  }))

  return (
    <Card className="my-4 min-w-0 border-border shadow-none" size="sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold tracking-[0.14em] uppercase">
          Executive Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="min-w-0">
        <div className="w-full overflow-hidden border">
          <table
            aria-label="MI Insight Weekly Sell-through Executive Summary"
            className="w-full table-fixed border-collapse text-xs"
          >
            <caption className="sr-only">
              MI Insight Weekly Sell-through Executive Summary
            </caption>
            <colgroup>
              <col className="w-[15%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
              <col className="w-[61%]" />
            </colgroup>
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium" scope="col">
                  지역
                </th>
                <th className="px-3 py-2 text-right font-medium" scope="col">
                  YoY (%)
                </th>
                <th className="px-3 py-2 text-right font-medium" scope="col">
                  WoW (%)
                </th>
                <th className="px-3 py-2 text-left font-medium" scope="col">
                  세부 내용
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map(({ region, yoy, wow, details }) => (
                <tr key={region}>
                  <th
                    className="px-3 py-2 text-left align-top font-medium text-foreground"
                    scope="row"
                  >
                    {region}
                  </th>
                  <td
                    className={`px-3 py-2 text-right align-top font-mono tabular-nums whitespace-nowrap ${
                      yoy !== null && yoy < 0
                        ? "text-destructive"
                        : "text-foreground"
                    }`}
                  >
                    {formatMetric(yoy)}
                  </td>
                  <td
                    className={`px-3 py-2 text-right align-top font-mono tabular-nums whitespace-nowrap ${
                      wow !== null && wow < 0
                        ? "text-destructive"
                        : "text-foreground"
                    }`}
                  >
                    {formatMetric(wow)}
                  </td>
                  <td className="min-w-0 px-3 py-2 align-top text-muted-foreground">
                    <ul className="grid gap-0.5 list-disc pl-4 leading-4">
                      {details.map((detail) => (
                        <li className="break-words" key={detail}>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
