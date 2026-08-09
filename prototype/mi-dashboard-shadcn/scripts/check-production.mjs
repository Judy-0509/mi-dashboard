import assert from "node:assert/strict"

import {
  cumulativeProduction,
  getForecastHistory,
  getProductionTotal,
  vendors,
} from "../src/data/production.ts"

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

console.log("production data checks passed")
