import { EditorialSummary } from "@/components/editorial-summary"
import {
  getWeeklyMetric,
  weeklyRegions,
  weeklySelectedWeek,
  type WeeklyRegion,
} from "@/data/weekly"

export function MiWeeklySellThroughSummary() {
  const regionalRows = weeklyRegions.map((region: WeeklyRegion) => ({
    region,
    yoy: getWeeklyMetric(weeklySelectedWeek, region, null, "yoy"),
    wow: getWeeklyMetric(weeklySelectedWeek, region, null, "wow"),
  }))

  return (
    <EditorialSummary
      kind="regional"
      page="mi-weekly-sell-through"
      regionalRows={regionalRows}
      title="지역별 YoY·WoW"
    />
  )
}
