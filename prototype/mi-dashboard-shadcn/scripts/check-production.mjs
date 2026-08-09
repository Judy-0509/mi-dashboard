import assert from "node:assert/strict"

import {
  cumulativeProduction,
  getForecastHistory,
  getProductionTotal,
  productionYAxisDomain,
  vendors,
} from "../src/data/production.ts"
import {
  getWeeklyCumulative,
  getWeeklyHeatmap,
  getWeeklyMetric,
  weeklySelectedWeek,
} from "../src/data/weekly.ts"
import { normalizeRow, parseCsv } from "./update-dashboard-data.mjs"

assert.equal(cumulativeProduction.length, 14)
assert.equal(productionYAxisDomain[0], 0)
assert.ok(
  productionYAxisDomain[1] >=
    Math.max(...cumulativeProduction.map(getProductionTotal))
)

for (const quarter of cumulativeProduction) {
  const history = getForecastHistory(quarter.quarter)
  assert.equal(history.length, 6)
  assert.deepEqual(
    vendors.map((vendor) => history.at(-1)[vendor.key]),
    vendors.map((vendor) => quarter[vendor.key])
  )

  const totals = history.map(getProductionTotal)
  assert.ok(
    totals.every((total, index) => index === 0 || total > totals[index - 1])
  )
  assert.ok(totals.every((total) => total <= productionYAxisDomain[1]))
}

assert.deepEqual(
  getForecastHistory("2026 Q3").map((point) => point.period),
  ["26-03월", "26-04월", "26-05월", "26-06월", "26-07월", "26-08월"]
)
assert.deepEqual(
  getForecastHistory("2024 Q1").map((point) => point.period),
  ["23-09월", "23-10월", "23-11월", "23-12월", "24-01월", "24-02월"]
)

const csvRows = parseCsv(
  [
    "quarter,apple,samsung,xiaomi,oppo,vivo,transsion,others",
    "2026 Q1,10,11,12,13,14,15,16",
    "2026 Q2,11,12,13,14,15,16,17",
  ].join("\n")
).map(normalizeRow)
assert.equal(csvRows.length, 2)
assert.deepEqual(csvRows.at(-1), {
  quarter: "2026 Q2",
  apple: 11,
  samsung: 12,
  xiaomi: 13,
  oppo: 14,
  vivo: 15,
  transsion: 16,
  others: 17,
})

const approximatelyEqual = (actual, expected, tolerance = 0.0005) =>
  Math.abs(actual - expected) <= tolerance
const weeklyTotal = getWeeklyCumulative("Total")

assert.equal(getWeeklyHeatmap("yoy").length, 8)
assert.ok(getWeeklyHeatmap("wow").every((row) => row.values.length === 6))
assert.ok(
  weeklyTotal.years.every((year, index) =>
    approximatelyEqual(year.total, [251.088, 264.886, 275.938, 294.817][index])
  )
)
assert.ok(
  weeklyTotal.years
    .at(-1)
    .segments.every((segment, index) =>
      approximatelyEqual(
        segment.value,
        [40.754, 117.686, 15.502, 60.128, 60.747][index]
      )
    )
)
assert.equal(getWeeklyMetric(weeklySelectedWeek, "Total", null, "yoy"), 6.8)
assert.equal(getWeeklyMetric(weeklySelectedWeek, "Total", null, "wow"), -0.2)
assert.equal(getWeeklyMetric(weeklySelectedWeek, "India", null, "yoy"), 9.3)

console.log("production and weekly data checks passed")
