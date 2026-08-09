import assert from "node:assert/strict"

import {
  cumulativeProduction,
  getForecastHistory,
  getProductionTotal,
  vendors,
} from "../src/data/production.ts"
import { normalizeRow, parseCsv } from "./update-dashboard-data.mjs"

assert.equal(cumulativeProduction.length, 14)

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
}

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

console.log("production data checks passed")
