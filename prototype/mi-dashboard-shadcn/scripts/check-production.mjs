import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

import {
  canonicalVendors,
  getVendorLabelColor,
  normalizeProviderValue,
  normalizeProviderVendorName,
  withVendorAdditions,
} from "../src/data/vendor-catalog.ts"

import {
  cumulativeProduction,
  getForecastHistory,
  getVendorHistoryDeltas,
  getProductionTotal,
  getVisibleVendorTotal,
  productionYAxisDomain,
  vendors,
} from "../src/data/production.ts"
import {
  aniFocusQuarter,
  aniModels,
  aniQuarterlyProduction,
  getAniForecastHistory,
  getAniHistorySummary,
  getAniLineupBuckets,
  getAniProductionTotal,
  getAniVisibleModelKeys,
  getAniVisibleModelKeysForLineup,
} from "../src/data/ani.ts"
import {
  getWeeklyCumulative,
  getWeeklyHeatmap,
  getWeeklyMetric,
  getWeeklyRegionalCumulative,
  getWeeklyTrend,
  getWeeklyVendorCumulative,
  sumWeeklySellOut,
  weeklyRegions,
  weeklyVendors,
  weeklySelectedWeek,
} from "../src/data/weekly.ts"
import {
  getSellThroughVendorTotals,
  getSellThroughRatio,
  inventorySnapshots,
  sellThroughMonthly,
  sellThroughMonths,
  sellThroughVendors,
} from "../src/data/sell-through.ts"
import { normalizeRow, parseCsv } from "./update-dashboard-data.mjs"
import {
  getMiInsightReports,
  miInsightInsights,
  miInsightReports,
} from "../src/data/mi-insight.ts"
import { miWeeklySellThroughDetails } from "../src/data/mi-weekly-sell-through.ts"
import {
  flagshipSalesMonths,
  flagshipSalesModels,
  flagshipSalesComparisonConfigs,
  flagshipSalesVendors,
  getFlagshipSalesChartData,
  getFlagshipSalesGenerationComparison,
  getFlagshipSalesLifecycle,
} from "../src/data/flagship-sales.ts"
import {
  getPipelineChartData,
  pipelineData,
  pipelineExecutiveSummary,
  pipelineQuarters,
  pipelineVendors,
  pipelineYAxisDomain,
  pipelineYAxisTicks,
} from "../src/data/pipeline-check.ts"
import {
  getIPhonePipelineChartData,
  iphonePipelineData,
  iphonePipelineExecutiveSummary,
  iphonePipelineLineups,
  iphonePipelineModels,
  iphonePipelineQuarters,
} from "../src/data/pipeline-check-iphone.ts"
import { getDefaultInventoryQuarters } from "../src/data/inventory-quarters.ts"

assert.deepEqual(canonicalVendors.map(({ key }) => key), [
  "apple",
  "samsung",
  "xiaomi",
  "huawei",
  "honor",
  "oppo",
  "vivo",
  "transsion",
  "lenovo",
  "google",
])
assert.deepEqual(canonicalVendors.map(({ label }) => label), [
  "Apple",
  "Samsung",
  "Xiaomi",
  "Huawei",
  "Honor",
  "OPPO",
  "vivo",
  "Transsion",
  "Lenovo",
  "Google",
])
assert.deepEqual(canonicalVendors.map(({ color }) => color), [
  "#e76f51",
  "#1d4ed8",
  "#bae6fd",
  "#7dd3fc",
  "#38bdf8",
  "#0ea5e9",
  "#0284c7",
  "#0369a1",
  "#075985",
  "#34a853",
])
assert.equal(getVendorLabelColor("#bae6fd"), "var(--foreground)")
assert.equal(getVendorLabelColor("#1d4ed8"), "var(--background)")
assert.equal(getVendorLabelColor("var(--chart-1)"), "var(--foreground)")
assert.equal(getVendorLabelColor("var(--chart-2)"), "var(--foreground)")
assert.equal(getVendorLabelColor("var(--chart-3)"), "var(--background)")
assert.equal(getVendorLabelColor("var(--chart-4)"), "var(--background)")
assert.equal(getVendorLabelColor("var(--chart-5)"), "var(--background)")
assert.equal(getVendorLabelColor("var(--chart-6)"), "var(--foreground)")
assert.equal(getVendorLabelColor("var(--chart-7)"), "var(--background)")
assert.equal(normalizeProviderVendorName(" HON-OR ", { honor: "honor" }), "honor")
assert.equal(normalizeProviderVendorName("unknown vendor", { honor: "honor" }), null)
assert.deepEqual(
  normalizeProviderValue(0, (raw) => (typeof raw === "number" ? raw : null)),
  { status: "available", value: 0 },
)
assert.deepEqual(
  normalizeProviderValue(null, (raw) => (typeof raw === "number" ? raw : null)),
  { status: "unavailable", value: null },
)
assert.equal(
  withVendorAdditions([{ key: "others", label: "Others", color: "var(--chart-7)" }]).at(-1).key,
  "others",
)
assert.throws(
  () => withVendorAdditions([{ key: "apple", label: "Duplicate", color: "var(--chart-7)" }]),
  /duplicate vendor key/i,
)

assert.equal(miInsightInsights.length, 3)
assert.ok(miInsightReports.length >= 1)
assert.ok(
  miInsightInsights.every(
    ({ title, details }) =>
      typeof title === "string" &&
      title.trim() &&
      details.length >= 1 &&
      details.length <= 2 &&
      details.every((detail) => typeof detail === "string" && detail.trim())
  )
)

const miInsightRequiredFields = [
  "fileName",
  "researchProvider",
  "useCase",
  "cadence",
  "uploadDate",
  "sharedContent",
  "edmUrl",
]

for (const report of miInsightReports) {
  for (const field of miInsightRequiredFields) {
    assert.ok(field in report)
  }
  assert.match(report.uploadDate, /^\d{4}-\d{2}-\d{2}$/)
  assert.ok(report.edmUrl === null || typeof report.edmUrl === "string")
}

const copiedMiInsightReports = getMiInsightReports()
assert.notStrictEqual(copiedMiInsightReports, miInsightReports)
assert.deepEqual(
  copiedMiInsightReports,
  [...miInsightReports].sort((left, right) =>
    right.uploadDate.localeCompare(left.uploadDate)
  )
)
assert.ok(
  copiedMiInsightReports.every(
    (report, index) =>
      index === 0 ||
      report.uploadDate <= copiedMiInsightReports[index - 1].uploadDate
  )
)

assert.deepEqual(sellThroughMonths, [
  "2025-09", "2025-10", "2025-11", "2025-12",
  "2026-01", "2026-02", "2026-03", "2026-04",
  "2026-05", "2026-06", "2026-07", "2026-08",
])
assert.equal(sellThroughMonthly.length, 12)
assert.deepEqual(sellThroughVendors.map(({ key }) => key), [
  "apple", "samsung", "xiaomi", "huawei", "honor", "oppo", "vivo",
  "transsion", "lenovo", "google", "others",
])
assert.equal(getSellThroughRatio(120, 100), 120)
assert.equal(getSellThroughRatio(120, 0), null)
assert.equal(inventorySnapshots.length, 11)
assert.ok(inventorySnapshots.every((row) => row.inventory.length === 3 && row.wos.length === 3))

assert.deepEqual(flagshipSalesMonths, [
  "2024-09",
  "2024-10",
  "2024-11",
  "2024-12",
  "2025-01",
  "2025-02",
  "2025-03",
  "2025-04",
  "2025-05",
  "2025-06",
  "2025-07",
  "2025-08",
  "2025-09",
  "2025-10",
  "2025-11",
  "2025-12",
  "2026-01",
  "2026-02",
  "2026-03",
  "2026-04",
  "2026-05",
  "2026-06",
  "2026-07",
  "2026-08",
])
assert.deepEqual(
  flagshipSalesVendors.map(({ key }) => key),
  [
    "apple", "samsung", "xiaomi", "huawei", "honor", "oppo", "vivo",
    "transsion", "lenovo", "google",
  ]
)
assert.equal(flagshipSalesVendors.length, 10)
assert.deepEqual(
  flagshipSalesVendors.map(({ label }) => label),
  [
    "Apple", "Samsung", "Xiaomi", "Huawei", "Honor", "OPPO", "vivo",
    "Transsion", "Lenovo", "Google",
  ]
)
const expectedFlagshipModels = {
  apple: [
    "iPhone 16",
    "iPhone 16 Plus",
    "iPhone 16 Pro",
    "iPhone 16 Pro Max",
    "iPhone 17",
    "iPhone Air",
    "iPhone 17 Pro",
    "iPhone 17 Pro Max",
  ],
  samsung: [
    "Galaxy S24",
    "Galaxy S24+",
    "Galaxy S24 Ultra",
    "Galaxy Z Fold6",
    "Galaxy Z Flip6",
    "Galaxy S25",
    "Galaxy S25+",
    "Galaxy S25 Ultra",
    "Galaxy Z Fold7",
    "Galaxy Z Flip7",
    "Galaxy S26",
    "Galaxy S26+",
    "Galaxy S26 Ultra",
  ],
  xiaomi: [
    "Xiaomi 14T Pro",
    "Xiaomi 15",
    "Xiaomi 15 Ultra",
    "Xiaomi 15T Pro",
    "Xiaomi 17",
    "Xiaomi 17 Ultra",
  ],
  oppo: [
    "OPPO Find X8",
    "OPPO Find X8 Pro",
    "OPPO Find N5",
    "OPPO Find X9",
    "OPPO Find X9 Pro",
    "OPPO Find N6",
    "OPPO Find X9 Ultra",
  ],
  vivo: [
    "vivo X200",
    "vivo X200 Pro",
    "vivo X Fold5",
    "vivo X300",
    "vivo X300 Pro",
    "vivo X300 Ultra",
  ],
  honor: [
    "HONOR Magic V3",
    "HONOR Magic7 Pro",
    "HONOR Magic V5",
    "HONOR Magic8 Pro",
    "HONOR Magic V6",
  ],
  google: [
    "Pixel 9",
    "Pixel 9 Pro",
    "Pixel 9 Pro XL",
    "Pixel 9 Pro Fold",
    "Pixel 10",
    "Pixel 10 Pro",
    "Pixel 10 Pro XL",
    "Pixel 10 Pro Fold",
  ],
}
const expectedFlagshipReleaseMonths = {
  "iPhone 16": "2024-09",
  "iPhone 16 Plus": "2024-09",
  "iPhone 16 Pro": "2024-09",
  "iPhone 16 Pro Max": "2024-09",
  "iPhone 17": "2025-09",
  "iPhone Air": "2025-09",
  "iPhone 17 Pro": "2025-09",
  "iPhone 17 Pro Max": "2025-09",
  "Galaxy S24": "2024-01",
  "Galaxy S24+": "2024-01",
  "Galaxy S24 Ultra": "2024-01",
  "Galaxy Z Fold6": "2024-07",
  "Galaxy Z Flip6": "2024-07",
  "Galaxy S25": "2025-02",
  "Galaxy S25+": "2025-02",
  "Galaxy S25 Ultra": "2025-02",
  "Galaxy Z Fold7": "2025-07",
  "Galaxy Z Flip7": "2025-07",
  "Galaxy S26": "2026-03",
  "Galaxy S26+": "2026-03",
  "Galaxy S26 Ultra": "2026-03",
  "Xiaomi 14T Pro": "2024-09",
  "Xiaomi 15": "2025-03",
  "Xiaomi 15 Ultra": "2025-03",
  "Xiaomi 15T Pro": "2025-09",
  "Xiaomi 17": "2026-02",
  "Xiaomi 17 Ultra": "2026-02",
  "OPPO Find X8": "2024-11",
  "OPPO Find X8 Pro": "2024-11",
  "OPPO Find N5": "2025-02",
  "OPPO Find X9": "2025-10",
  "OPPO Find X9 Pro": "2025-10",
  "OPPO Find N6": "2026-03",
  "OPPO Find X9 Ultra": "2026-04",
  "vivo X200": "2024-11",
  "vivo X200 Pro": "2024-11",
  "vivo X Fold5": "2025-06",
  "vivo X300": "2025-10",
  "vivo X300 Pro": "2025-10",
  "vivo X300 Ultra": "2026-04",
  "HONOR Magic V3": "2024-09",
  "HONOR Magic7 Pro": "2025-01",
  "HONOR Magic V5": "2025-08",
  "HONOR Magic8 Pro": "2026-01",
  "HONOR Magic V6": "2026-06",
  "Pixel 9": "2024-08",
  "Pixel 9 Pro": "2024-09",
  "Pixel 9 Pro XL": "2024-08",
  "Pixel 9 Pro Fold": "2024-09",
  "Pixel 10": "2025-08",
  "Pixel 10 Pro": "2025-08",
  "Pixel 10 Pro XL": "2025-08",
  "Pixel 10 Pro Fold": "2025-10",
}
for (const vendor of flagshipSalesVendors) {
  if (vendor.availability === "unavailable") continue
  assert.deepEqual(
    vendor.models.map(({ label }) => label),
    expectedFlagshipModels[vendor.key]
  )
}
assert.equal(flagshipSalesModels.length, 53)
for (const model of flagshipSalesModels) {
  assert.equal(model.releaseMonth, expectedFlagshipReleaseMonths[model.label])
  assert.equal(model.salesFromLaunch.length, 24)
  assert.equal(model.source.isEstimated, true)
  assert.ok(model.source.marketScope.trim())
  assert.match(model.source.url, /^https:\/\//)
}
assert.equal(
  flagshipSalesModels.find(({ label }) => label === "Xiaomi 17").source.url,
  "https://www.mi.com/global/product/xiaomi-17/"
)
assert.equal(
  flagshipSalesModels.find(({ label }) => label === "Galaxy S25").source.url,
  "https://news.samsung.com/global/samsung-galaxy-s25-series-arrives-worldwide/"
)
for (const vendor of flagshipSalesVendors) {
  if (vendor.availability === "unavailable") {
    assert.equal(vendor.models.length, 0)
    continue
  }
  assert.ok(vendor.models.length >= 2)
  const selectedKeys = vendor.models.map(({ key }) => key)
  const calendar = getFlagshipSalesChartData(
    vendor.key,
    "calendar",
    selectedKeys
  )
  const lifecycle = getFlagshipSalesChartData(
    vendor.key,
    "launch",
    selectedKeys
  )
  assert.equal(calendar.length, 24)
  assert.equal(lifecycle.length, 24)
  assert.equal(calendar[0].period, "2024-09")
  assert.equal(lifecycle[0].period, "M0")
  assert.equal(lifecycle.at(-1).period, "M+23")
  assert.ok(
    vendor.models.every(
      (model) => getFlagshipSalesLifecycle(model).length === 24
    )
  )
}
const xiaomiCalendar = getFlagshipSalesChartData("xiaomi", "calendar", [
  "xiaomi14TPro",
  "xiaomi15",
  "xiaomi15Ultra",
  "xiaomi15TPro",
  "xiaomi17",
  "xiaomi17Ultra",
])
const xiaomiPreLaunch = xiaomiCalendar.find(
  (point) => point.period === "2024-09"
)
assert.ok(xiaomiPreLaunch)
assert.equal(
  xiaomiPreLaunch.xiaomi14TPro,
  flagshipSalesModels.find(({ label }) => label === "Xiaomi 14T Pro")
    .salesFromLaunch[0]
)
assert.equal(xiaomiPreLaunch.xiaomi15, 0)
assert.equal(xiaomiPreLaunch.xiaomi15Ultra, 0)
assert.equal(xiaomiPreLaunch.xiaomi15TPro, 0)
assert.equal(xiaomiPreLaunch.xiaomi17, 0)
assert.equal(xiaomiPreLaunch.xiaomi17Ultra, 0)
const s24 = flagshipSalesModels.find(({ label }) => label === "Galaxy S24")
assert.ok(s24)
const samsungCalendar = getFlagshipSalesChartData("samsung", "calendar", [
  s24.key,
])
assert.equal(samsungCalendar[0].galaxyS24, s24.salesFromLaunch[8])
const s25 = flagshipSalesModels.find(({ label }) => label === "Galaxy S25")
assert.ok(s25)
const s25ReleasePoint = getFlagshipSalesChartData("samsung", "calendar", [
  s25.key,
]).find((point) => point.period === s25.releaseMonth)
assert.ok(s25ReleasePoint)
assert.equal(s25ReleasePoint.galaxyS25, s25.salesFromLaunch[0])
assert.deepEqual(getFlagshipSalesLifecycle(s25), s25.salesFromLaunch)
for (const model of flagshipSalesModels) {
  const calendar = getFlagshipSalesChartData(model.vendor, "calendar", [
    model.key,
  ])
  for (const point of calendar) {
    if (point.period < model.releaseMonth) assert.equal(point[model.key], 0)
  }
}

assert.deepEqual(Object.keys(flagshipSalesComparisonConfigs), [
  "apple",
  "samsung",
  "xiaomi",
  "oppo",
  "vivo",
  "honor",
  "google",
])
assert.deepEqual(flagshipSalesComparisonConfigs.apple.pairs, [
  {
    rowLabel: "Basic",
    currentModelKey: "iphone17",
    previousModelKey: "iphone16",
  },
  {
    rowLabel: "Plus/Air",
    currentModelKey: "iphoneAir",
    previousModelKey: "iphone16Plus",
  },
  {
    rowLabel: "Pro",
    currentModelKey: "iphone17Pro",
    previousModelKey: "iphone16Pro",
  },
  {
    rowLabel: "Pro Max",
    currentModelKey: "iphone17ProMax",
    previousModelKey: "iphone16ProMax",
  },
])
for (const vendor of flagshipSalesVendors) {
  if (vendor.availability === "unavailable") continue
  assert.ok(flagshipSalesComparisonConfigs[vendor.key].pairs.length >= 1)
  const comparison = getFlagshipSalesGenerationComparison(vendor.key)
  assert.equal(comparison.rows[0].rowLabel, "전체 시리즈")
  const modelRows = comparison.rows.slice(1)
  assert.ok(
    modelRows.every(
      ({ deltaMu, deltaPercent }) =>
        Number.isFinite(deltaMu) && Number.isFinite(deltaPercent)
    )
  )
  assert.equal(
    comparison.rows[0].currentCumulative,
    modelRows.reduce((total, row) => total + row.currentCumulative, 0)
  )
  assert.equal(
    comparison.rows[0].previousCumulative,
    modelRows.reduce((total, row) => total + row.previousCumulative, 0)
  )
}
const appleComparison = getFlagshipSalesGenerationComparison("apple")
assert.deepEqual(
  appleComparison.rows.map(
    ({ rowLabel, currentModelLabel, previousModelLabel }) => [
      rowLabel,
      currentModelLabel,
      previousModelLabel,
    ]
  ),
  [
    ["전체 시리즈", "iPhone 17", "iPhone 16"],
    ["Basic", "iPhone 17", "iPhone 16"],
    ["Plus/Air", "iPhone Air", "iPhone 16 Plus"],
    ["Pro", "iPhone 17 Pro", "iPhone 16 Pro"],
    ["Pro Max", "iPhone 17 Pro Max", "iPhone 16 Pro Max"],
  ]
)
assert.equal(appleComparison.rows[0].duration, 12)
assert.ok(
  appleComparison.rows.slice(1).every(({ duration }) => duration === 12)
)

assert.equal(cumulativeProduction.length, 14)
assert.equal(productionYAxisDomain[0], 0)
assert.ok(
  productionYAxisDomain[1] >=
    Math.max(
      ...cumulativeProduction
        .map(getProductionTotal)
        .filter((value) => value !== null),
    )
)

for (const quarter of cumulativeProduction) {
  const history = getForecastHistory(quarter.quarter)
  assert.equal(history.length, 6)
  assert.deepEqual(
    vendors.map((vendor) => history.at(-1)[vendor.key]),
    vendors.map((vendor) => quarter[vendor.key]),
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

const focusQuarter = cumulativeProduction.find(
  (item) => item.quarter === "2026 Q3"
)
assert.ok(focusQuarter)
assert.equal(getVisibleVendorTotal(focusQuarter, ["apple", "samsung"]), 130)
assert.equal(getVisibleVendorTotal(focusQuarter, ["transsion"]), 32)
assert.deepEqual(getVendorHistoryDeltas(getForecastHistory("2026 Q3")), {
  apple: 1.5,
  samsung: 1.4,
  xiaomi: 0.8,
  huawei: null,
  honor: null,
  oppo: 0.5,
  vivo: 0.4,
  transsion: 0.3,
  lenovo: null,
  google: null,
  others: 0.5,
})

assert.equal(aniQuarterlyProduction.length, 14)
assert.deepEqual(
  aniQuarterlyProduction.map((item) => item.quarter),
  [
    "2024 Q1",
    "2024 Q2",
    "2024 Q3",
    "2024 Q4",
    "2025 Q1",
    "2025 Q2",
    "2025 Q3",
    "2025 Q4",
    "2026 Q1",
    "2026 Q2",
    "2026 Q3",
    "2026 Q4",
    "2027 Q1",
    "2027 Q2",
  ],
)
assert.equal(aniModels.length, 20)
assert.equal(new Set(aniModels.map((model) => model.key)).size, 20)
assert.equal(
  aniModels.filter((model) => model.generation === "iphone15").length,
  4,
)
assert.equal(
  aniModels.filter((model) => model.generation === "iphone16").length,
  5,
)
assert.equal(
  aniModels.filter((model) => model.generation === "iphone17").length,
  5,
)
assert.equal(
  aniModels.filter((model) => model.generation === "iphone18").length,
  6,
)
assert.deepEqual(getAniVisibleModelKeys(["iphone16"], ["e"]), ["iphone16E"])
assert.deepEqual(getAniVisibleModelKeys(["iphone17"], ["plusAir"]), ["iphone17Air"])
assert.deepEqual(
  getAniVisibleModelKeys(["iphone18"], ["foldable"]),
  ["iphone18Foldable"],
)
assert.deepEqual(
  getAniVisibleModelKeys(["iphone16", "iphone17"], ["pro", "e"]),
  ["iphone16Pro", "iphone16E", "iphone17Pro", "iphone17E"],
)
assert.deepEqual(getAniLineupBuckets("2024 Q1"), {
  iphone15: "n",
})
assert.deepEqual(getAniLineupBuckets("2024 Q3"), {
  iphone15: "nPlus1",
  iphone16: "n",
})
assert.deepEqual(getAniLineupBuckets("2025 Q3"), {
  iphone15: "nPlus2",
  iphone16: "nPlus1",
  iphone17: "n",
})
assert.deepEqual(getAniLineupBuckets("2026 Q3"), {
  iphone15: "legacy",
  iphone16: "nPlus2",
  iphone17: "nPlus1",
  iphone18: "n",
})
assert.deepEqual(
  getAniVisibleModelKeysForLineup("2026 Q3", ["nPlus1"], ["plusAir"]),
  ["iphone17Air"],
)
assert.equal(aniFocusQuarter, "2027 Q2")
assert.equal(getAniForecastHistory("2027 Q2").length, 6)

const findAniModel = (key) => aniModels.find((model) => model.key === key)
assert.equal(findAniModel("iphone16E").color, findAniModel("iphone16Plus").color)
assert.equal(findAniModel("iphone17E").color, findAniModel("iphone17Air").color)
assert.equal(findAniModel("iphone18E").color, findAniModel("iphone18Air").color)
assert.equal(
  findAniModel("iphone18Foldable").color,
  findAniModel("iphone18ProMax").color,
)

for (const quarter of aniQuarterlyProduction) {
  assert.equal(
    getAniProductionTotal(quarter),
    aniModels.reduce((total, model) => total + quarter[model.key], 0),
  )

  const history = getAniForecastHistory(quarter.quarter)
  assert.equal(history.length, 6)
  for (const model of aniModels) {
    assert.equal(history.at(-1)[model.key], quarter[model.key])
  }
}

const aniSummaryHistory = getAniForecastHistory("2027 Q2")
const aniSummaryVisibleKeys = ["iphone18Basic", "iphone18Foldable"]
const aniSummaryCurrent = aniSummaryVisibleKeys.reduce(
  (total, modelKey) => total + aniSummaryHistory.at(-1)[modelKey],
  0,
)
const aniSummaryPrevious = aniSummaryVisibleKeys.reduce(
  (total, modelKey) => total + aniSummaryHistory.at(-2)[modelKey],
  0,
)
const aniSummaryFirst = aniSummaryVisibleKeys.reduce(
  (total, modelKey) => total + aniSummaryHistory[0][modelKey],
  0,
)
const aniSummary = getAniHistorySummary(
  aniSummaryHistory,
  aniSummaryVisibleKeys,
)
assert.equal(aniSummary.currentTotal, aniSummaryCurrent)
assert.equal(
  aniSummary.monthOverMonth,
  Number((aniSummaryCurrent - aniSummaryPrevious).toFixed(1)),
)
assert.equal(
  aniSummary.sixMonth,
  Number((aniSummaryCurrent - aniSummaryFirst).toFixed(1)),
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
  huawei: null,
  honor: null,
  oppo: 14,
  vivo: 15,
  transsion: 16,
  lenovo: null,
  google: null,
  others: 17,
})

const approximatelyEqual = (actual, expected, tolerance = 0.0005) =>
  Math.abs(actual - expected) <= tolerance
const weeklyTotal = getWeeklyCumulative("Total")
const appleRegional = getWeeklyRegionalCumulative("apple")
const usaVendor = getWeeklyVendorCumulative("USA")

assert.equal(getWeeklyHeatmap("yoy").length, 12)
assert.ok(getWeeklyHeatmap("wow").every((row) => row.values.length === 6))
assert.deepEqual(appleRegional.segmentNames, weeklyRegions.slice(1))
assert.deepEqual(usaVendor.segmentNames, weeklyVendors.map(({ label }) => label))
const appleUsa = sumWeeklySellOut(
  2026,
  weeklySelectedWeek,
  "USA",
  "apple",
  true,
)
assert.ok(
  approximatelyEqual(
    appleRegional.years.at(-1).segments.find((segment) => segment.name === "USA").value,
    appleUsa,
  ),
)
assert.ok(
  approximatelyEqual(
    usaVendor.years.at(-1).segments.find((segment) => segment.name === "Apple").value,
    appleUsa,
  ),
)
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
assert.ok(
  weeklyRegions.every(
    (region) =>
      miWeeklySellThroughDetails[region].length >= 2 &&
      miWeeklySellThroughDetails[region].length <= 4 &&
      miWeeklySellThroughDetails[region].every(
        (detail) => typeof detail === "string" && detail.trim(),
      ),
  ),
)

const totalWeeklyTrend = getWeeklyTrend("Total", null, "mu")
assert.equal(totalWeeklyTrend.length, 52)
assert.equal(totalWeeklyTrend[0].week, "W01")
assert.equal(totalWeeklyTrend[51].week, "W52")
assert.ok(totalWeeklyTrend[31].y2026 > 0)
assert.equal(totalWeeklyTrend[32].y2026, null)
assert.ok(totalWeeklyTrend[51].y2023 > 0)
assert.ok(totalWeeklyTrend[51].y2024 > 0)
assert.ok(totalWeeklyTrend[51].y2025 > 0)

const usaAppleShareTrend = getWeeklyTrend("USA", "apple", "share")
assert.ok(
  usaAppleShareTrend
    .slice(0, weeklySelectedWeek)
    .every((point) => point.y2026 > 0 && point.y2026 < 100)
)
assert.equal(usaAppleShareTrend[weeklySelectedWeek].y2026, null)
const usaAppleMuTrend = getWeeklyTrend("USA", "apple", "mu")
assert.equal(usaAppleMuTrend.length, 52)
assert.ok(usaAppleMuTrend[0].y2023 > 0)

const appSource = readFileSync(
  new URL("../src/App.tsx", import.meta.url),
  "utf8"
)
const weeklyAnalysisSource = readFileSync(
  new URL("../src/components/weekly-analysis.tsx", import.meta.url),
  "utf8"
)
const sidebarSource = readFileSync(
  new URL("../src/components/portal-sidebar.tsx", import.meta.url),
  "utf8"
)
const pageConfigSource = readFileSync(
  new URL("../src/data/page-config.json", import.meta.url),
  "utf8"
)
const sellThroughSource = readFileSync(
  new URL("../src/components/sell-through-analysis.tsx", import.meta.url),
  "utf8"
)
const flagshipSalesSource = readFileSync(
  new URL("../src/components/flagship-sales-chart.tsx", import.meta.url),
  "utf8"
)
const miWeeklySummarySource = readFileSync(
  new URL("../src/components/mi-weekly-sell-through-summary.tsx", import.meta.url),
  "utf8"
)
const productionSource = readFileSync(
  new URL("../src/components/cumulative-production-chart.tsx", import.meta.url),
  "utf8",
)

assert.deepEqual(vendors.map(({ key }) => key), [
  "apple",
  "samsung",
  "xiaomi",
  "huawei",
  "honor",
  "oppo",
  "vivo",
  "transsion",
  "lenovo",
  "google",
  "others",
])
assert.deepEqual(weeklyVendors.map(({ key }) => key), [
  "apple",
  "samsung",
  "xiaomi",
  "huawei",
  "honor",
  "oppo",
  "vivo",
  "transsion",
  "lenovo",
  "google",
  "others",
])
assert.deepEqual(sellThroughVendors.map(({ key }) => key), [
  "apple",
  "samsung",
  "xiaomi",
  "huawei",
  "honor",
  "oppo",
  "vivo",
  "transsion",
  "lenovo",
  "google",
  "others",
])
assert.deepEqual(flagshipSalesVendors.map(({ key }) => key), [
  "apple",
  "samsung",
  "xiaomi",
  "huawei",
  "honor",
  "oppo",
  "vivo",
  "transsion",
  "lenovo",
  "google",
])
assert.equal(
  normalizeProviderValue(0, (raw) =>
    typeof raw === "number" ? raw : null,
  ).value,
  0,
)
const unavailable = Object.fromEntries(
  [...canonicalVendors, { key: "others" }].map(({ key }) => [key, {
    status: "unavailable",
    value: null,
  }]),
)
const zero = Object.fromEntries(
  [...canonicalVendors, { key: "others" }].map(({ key }) => [key, {
    status: "available",
    value: 0,
  }]),
)
assert.equal(
  getSellThroughVendorTotals({
    month: "2026-08",
    sellIn: unavailable,
    sellThrough: unavailable,
  }).sellIn,
  null,
)
assert.equal(
  getSellThroughVendorTotals({
    month: "2026-08",
    sellIn: zero,
    sellThrough: zero,
  }).sellIn,
  0,
)
assert.equal(getFlagshipSalesGenerationComparison("transsion"), null)
for (const source of [
  productionSource,
  weeklyAnalysisSource,
  sellThroughSource,
  flagshipSalesSource,
]) {
  assert.match(source, /—/)
  assert.match(source, /데이터 없음/)
}
assert.match(weeklyAnalysisSource, /weeklyVendors\.map/)
assert.match(sellThroughSource, /sellThroughVendors\.map/)
assert.match(flagshipSalesSource, /disabled|isDisabled/)

assert.match(sidebarSource, /Sell-in \/ Sell-through/)
assert.match(sidebarSource, /#sell-through/)
assert.match(sidebarSource, /child: "Flagship Sales"/)
assert.match(sidebarSource, /page: "flagship-sales"/)
assert.match(sidebarSource, /href: "#flagship-sales"/)
assert.match(sidebarSource, /label: "MI TAM"/)
assert.match(sidebarSource, /child: "Pipeline Check"/)
assert.match(sidebarSource, /page: "pipeline-check"/)
assert.match(sidebarSource, /href: "#pipeline-check"/)
assert.match(sidebarSource, /useState\(false\)/)
assert.match(sidebarSource, /collapsed \? "w-10" : "w-64"/)
assert.match(sidebarSource, /transition-\[width\]/)
assert.match(sidebarSource, /aria-expanded={!collapsed}/)
assert.match(
  sidebarSource,
  /collapsed \? "네비게이션바 펼치기" : "네비게이션바 접기"/
)
assert.match(sidebarSource, /collapsed \? <PanelLeftOpen/)
assert.match(sidebarSource, /: <PanelLeftClose/)
assert.match(sidebarSource, /{!collapsed && \(/)
assert.doesNotMatch(sidebarSource, /localStorage|sessionStorage/)
assert.match(pageConfigSource, /"hash": "#sell-through"/)
assert.match(pageConfigSource, /"hash": "#flagship-sales"/)
assert.match(pageConfigSource, /"exportFileName": "MI_Counterpoint_Flagship_Sales\.html"/)
assert.match(pageConfigSource, /"originalExcelUrl": null/)
assert.deepEqual(JSON.parse(pageConfigSource)["pipeline-check"], {
  hash: "#pipeline-check",
  exportFileName: "MI_TAM_Pipeline_Check.html",
  originalExcelUrl: null,
})
assert.match(appSource, /SellThroughAnalysis/)
assert.match(appSource, /Counterpoint \/ Sell-in · Sell-through/)
assert.match(appSource, /스마트폰 Sell-in \/ Sell-through/)
assert.match(appSource, /function FlagshipSalesPage()/)
assert.match(appSource, /<FlagshipSalesChart \/>/)
assert.match(appSource, /Counterpoint \/ Flagship Sales/)
assert.match(appSource, /PageActions page="flagship-sales" \/>/)
assert.match(appSource, /MI TAM \/ PIPELINE CHECK/)
assert.match(appSource, /분기별 Pipeline Check/)
assert.match(appSource, /2025 Q1–2026 Q2 Production · Inventory · Sell-in · Sell-out/)
assert.match(appSource, /<PageActions page="pipeline-check" \/>/)
assert.match(appSource, /<PipelineCheck \/>/)
assert.match(
  appSource,
  /activePage === "pipeline-check" \? \(\s*<PipelineCheckPage \/>/,
)
assert.match(flagshipSalesSource, /useState<FlagshipSalesVendorKey>\("apple"\)/)
assert.match(flagshipSalesSource, /flagshipSalesVendors/)
assert.match(flagshipSalesSource, /Calendar Month/)
assert.match(flagshipSalesSource, /Since Launch/)
assert.match(flagshipSalesSource, /ONLY/)
assert.match(flagshipSalesSource, /getFlagshipSalesChartData/)
assert.match(flagshipSalesSource, /getFlagshipSalesGenerationComparison/)
assert.match(flagshipSalesSource, /세대별 판매 비교/)
assert.match(flagshipSalesSource, /<table/)
assert.match(flagshipSalesSource, /grid-cols-\[minmax\(0,1fr\)_320px\]/)
assert.match(flagshipSalesSource, /stackId="flagship-sales"/)
assert.match(flagshipSalesSource, /LabelList/)
assert.match(sellThroughSource, /58fr.*42fr/)
assert.match(sellThroughSource, /Vendor.*Total/)
assert.match(sellThroughSource, /Inventory/)
assert.match(sellThroughSource, /25년 말.*26년 4월.*26년 8월/)
assert.match(
  sellThroughSource,
  /function SellThroughLegend[\s\S]*view === "vendor"[\s\S]*Vendor legend[\s\S]*Sell-in \/ Sell-through legend/
)

assert.match(sellThroughSource, /Sell-in.*Sell-through/)
assert.match(sellThroughSource, /ratio/)
assert.match(sellThroughSource, /SI\/ST Ratio\(%\)/)
assert.match(sellThroughSource, /useState<SellThroughView>\("total"\)/)
assert.match(sellThroughSource, /domain=\{\[0, 500\]\}/)
assert.match(sellThroughSource, /domain=\{\[90, 110\]\}/)
assert.match(sellThroughSource, /dataKey=\{`si_\$\{vendor\.key\}`\}[\s\S]*position="center"/)
assert.match(sellThroughSource, /dataKey=\{`st_\$\{vendor\.key\}`\}[\s\S]*position="center"/)
assert.match(sellThroughSource, /fill=\{getVendorLabelColor\(vendor\.color\)\}/)
assert.match(sellThroughSource, /type-table-body w-full table-fixed border-collapse/)
assert.match(sellThroughSource, /#d97706/)
assert.match(
  sellThroughSource,
  /const sellThroughChartData[\s\S]*sellThroughMonthly\.map/
)
assert.match(
  sellThroughSource,
  /<Line[\s\S]*dataKey="ratio"[\s\S]*dot=\{\{ fill: ratioColor/
)
assert.match(
  sellThroughSource,
  /grid-cols-\[minmax\(0,58fr\)_minmax\(0,42fr\)\][\s\S]*items-stretch/
)
assert.match(sellThroughSource, /aria-label=.*Inventory|caption.*Inventory/i)
assert.doesNotMatch(sellThroughSource, /region selector|지역 selector/i)
assert.doesNotMatch(appSource, /ExecutiveSummary.*sell-through|sell-through.*ExecutiveSummary/i)
assert.doesNotMatch(sellThroughSource, /getWeekly|weekly\.ts|CumulativeProductionChart/i)

assert.match(sidebarSource, /export type PortalPage =[\s\S]*\| "mi-insight"/)
assert.match(sidebarSource, /label: "ANI"/)
assert.match(sidebarSource, /child: "iPhone Model Production"/)
assert.match(sidebarSource, /page: "ani"/)
assert.match(sidebarSource, /href: "#ani"/)
assert.match(
  sidebarSource,
  /label: "Counterpoint"[\s\S]*label: "MI Insight"[\s\S]*child: "Weekly Report"[\s\S]*page: "mi-insight"[\s\S]*href: "#mi-insight"[\s\S]*child: "Weekly Sell-through"[\s\S]*page: "mi-weekly-sell-through"[\s\S]*href: "#mi-weekly-sell-through"[\s\S]*label: "ANI"/,
)
assert.match(pageConfigSource, /"hash": "#ani"/)
assert.match(
  pageConfigSource,
  /"mi-insight": \{\s*"hash": "#mi-insight",\s*"exportFileName": "MI_Insight_Weekly_Report\.html",\s*"originalExcelUrl": null\s*\}/,
)
assert.match(
  pageConfigSource,
  /"mi-weekly-sell-through": \{\s*"hash": "#mi-weekly-sell-through",\s*"exportFileName": "MI_Insight_Weekly_SellThrough\.html",\s*"originalExcelUrl": null\s*\}/,
)
assert.match(appSource, /const hash = PAGE_CONFIG\[page\]\.hash/)
assert.match(appSource, /function AniPage\(\)/)
assert.match(appSource, /<AniPage \/>/)
assert.match(appSource, /<AniProductionChart \/>/)
assert.match(appSource, /ANI \/ iPhone Model Production/)
assert.match(appSource, /iPhone 모델 생산 전망/)
assert.match(appSource, /2024 Q1–2027 Q2 분기별 Forecast · 단위: Mu/)
assert.match(appSource, /activePage === "ani"/)
assert.match(
  appSource,
  /function MiInsightPage\(\)[\s\S]*?<p[^>]*>\s*MI Insight \/ Weekly Report\s*<\/p>[\s\S]*?<h1[^>]*>\s*Weekly Report\s*<\/h1>[\s\S]*?<p[^>]*>\s*EDM 업데이트 자료와 공유 내용\s*<\/p>[\s\S]*?<PageActions page="mi-insight" \/>/,
)
assert.match(
  appSource,
  /function MiInsightWeeklySellThroughPage\(\)[\s\S]*?<p[^>]*>\s*MI Insight \/ Weekly Sell-through\s*<\/p>[\s\S]*?<h1[^>]*>\s*Weekly Sell-through\s*<\/h1>[\s\S]*?<PageActions page="mi-weekly-sell-through" \/>[\s\S]*?<MiWeeklySellThroughSummary \/>[\s\S]*?<WeeklyAnalysis \/>/,
)
assert.match(miWeeklySummarySource, /<table[\s\S]*type-table-body w-full table-fixed border-collapse/)
assert.match(miWeeklySummarySource, /YoY \(%\)/)
assert.match(miWeeklySummarySource, /WoW \(%\)/)
assert.match(miWeeklySummarySource, /세부 내용/)
assert.match(miWeeklySummarySource, /weeklyRegions\.map/)
assert.match(miWeeklySummarySource, /miWeeklySellThroughDetails\[region\]/)
assert.match(miWeeklySummarySource, /scope="row"/)

const aniChartSource = readFileSync(
  new URL("../src/components/ani-production-chart.tsx", import.meta.url),
  "utf8"
)

assert.match(aniChartSource, /grid-cols-\[minmax\(0,58fr\)_minmax\(0,42fr\)\]/)
assert.match(aniChartSource, /getAniVisibleModelKeys/)
assert.match(aniChartSource, /getAniForecastHistory\(selectedQuarter\)/)
assert.match(aniChartSource, /history\.map/)
assert.match(aniChartSource, /onClick=\{\(\{ activeLabel \}\)/)
assert.match(aniChartSource, /시리즈/)
assert.match(aniChartSource, /모델 유형/)
assert.match(aniChartSource, /현재 Forecast/)
assert.match(aniChartSource, /전월 대비/)
assert.match(aniChartSource, /6개월 대비/)
assert.match(aniChartSource, /height < 12/)
assert.match(aniChartSource, /useState<AniFilterMode>\("lineup"\)/)
assert.match(aniChartSource, /라인업 기준/)
assert.match(aniChartSource, /시리즈 기준/)
assert.match(aniChartSource, /getAniVisibleModelKeysForLineup/)
assert.match(aniChartSource, /시리즈 색상 범례/)
assert.match(aniChartSource, /renderAniTotalLabel/)
assert.match(aniChartSource, /payload/)
assert.match(aniChartSource, /topVisibleModelKey/)
assert.match(aniChartSource, /const visibleYAxisDomain/)
assert.match(aniChartSource, /productionWithVisibleTotals\.map/)
assert.match(aniChartSource, /historyWithVisibleTotals\.map/)
assert.match(aniChartSource, /Math\.max\(10/)
assert.equal(
  aniChartSource.match(/domain=\{visibleYAxisDomain\}/g)?.length,
  2,
)
assert.match(aniChartSource, /const \[hoveredQuarter, setHoveredQuarter\]/)
assert.match(aniChartSource, /onMouseMove=\{\(\{ activeLabel \}\)/)
assert.match(aniChartSource, /onMouseLeave=\{\(\) => setHoveredQuarter\(null\)\}/)
assert.match(aniChartSource, /function AniQuarterTick/)
assert.match(
  aniChartSource,
  /tick=\{<AniQuarterTick selectedQuarter=\{selectedQuarter\} \/>\}/,
)
assert.match(aniChartSource, /aria-label=\{`\$\{quarter\}/)
assert.match(aniChartSource, /strokeWidth=\{2\}/)
assert.doesNotMatch(aniChartSource, /stroke=\{\s*selectedQuarter === item\.quarter/)
assert.doesNotMatch(
  aniChartSource,
  /strokeWidth=\{\s*selectedQuarter === item\.quarter/,
)
assert.doesNotMatch(aniChartSource, /fillOpacity=\{\s*selectedQuarter === item\.quarter/)
assert.match(aniChartSource, /function AniPatternDefs/)
assert.match(aniChartSource, /patternUnits="userSpaceOnUse"/)
assert.match(aniChartSource, /prefix="ani-quarterly"/)
assert.match(aniChartSource, /prefix="ani-history"/)
assert.match(aniChartSource, /fill=\{getAniBarFill\(model, "ani-quarterly"\)\}/)
assert.match(aniChartSource, /fill=\{getAniBarFill\(model, "ani-history"\)\}/)
assert.match(aniChartSource, /repeating-linear-gradient/)
assert.match(aniChartSource, /radial-gradient/)
assert.match(
  aniChartSource,
  /generationLegendTypes = \[\s*"basic",\s*"plusAir",\s*"pro",\s*"proMax",\s*"e",\s*"foldable"/,
)
assert.match(aniChartSource, /getAniLegendSwatchStyle\(model\)/)
assert.match(aniChartSource, /getAniNeutralPatternStyle\(type\)/)
assert.match(aniChartSource, /getAniNeutralPatternStyle\(key\)/)
assert.match(aniChartSource, /backgroundColor: "var\(--muted-foreground\)"/)
assert.match(aniChartSource, /사선 · e/)
assert.match(aniChartSource, /점 · Foldable/)
assert.match(
  aniChartSource,
  /className="type-control inline-flex h-7 shrink-0 items-center gap-1\.5 rounded-md border border-border bg-secondary px-2 text-secondary-foreground"/,
)
assert.match(aniChartSource, /className="size-2\.5"/)
assert.doesNotMatch(aniChartSource, /text-\[10px\]/)
assert.equal(
  aniChartSource.match(/\{aniModels\.map\(\(model\) => \(\s*<Bar/g)?.length,
  2,
)
assert.doesNotMatch(
  aniChartSource,
  /\{visibleModels\.map\(\(model\) => \(\s*<Bar/,
)
assert.doesNotMatch(
  aniChartSource,
  /hide=\{!chartModelKeys\.includes\(model\.key\)\}/,
)
assert.equal(
  aniChartSource.match(
    /payload=\{props\.payload\?\.filter\(\s*\(\{\s*value\s*\}\)\s*=>\s*Number\(value\)\s*!==\s*0,\s*\)\}/g,
  )?.length,
  2,
)
assert.doesNotMatch(
  aniChartSource,
  /specialLegendTypes\.map\(\(type\) => \{\s*const model = aniModels\.find/,
)
assert.equal(aniChartSource.match(/<ReferenceLine/g)?.length, 2)
assert.match(aniChartSource, /x="2025 Q2"/)
assert.match(aniChartSource, /label=\{\{\s*value: "NEW · e"/)
assert.match(aniChartSource, /x="2027 Q1"/)
assert.match(aniChartSource, /label=\{\{\s*value: "NEW · Foldable"/)
assert.match(
  aniChartSource,
  /getVisibleModelKeysForQuarter\("2025 Q2"\)\.includes\("iphone16E"\)/,
)
assert.match(
  aniChartSource,
  /getVisibleModelKeysForQuarter\("2027 Q1"\)\.includes\("iphone18Foldable"\)/,
)
assert.doesNotMatch(aniChartSource, /getVendorHistoryDeltas/)
assert.doesNotMatch(aniChartSource, /업체별 전망 변화/)

assert.doesNotMatch(appSource, /기준: 2026 W32 · 단위: Mu/)
assert.match(appSource, /__MI_EXPORT_PAGE__\?: PortalPage/)
assert.match(appSource, /const PAGE_CONFIG = pageConfig as Record<PortalPage, PageConfig>/)
assert.match(appSource, /function PageActions\(\{ page \}: \{ page: PortalPage \}\)/)
assert.match(appSource, /download=\{config\.exportFileName\}/)
assert.match(appSource, /href=\{`\.\/\$\{config\.exportFileName\}`\}/)
assert.match(appSource, /aria-disabled=\{excelDisabled\}/)
assert.match(appSource, /isExport \? null/)
assert.match(appSource, /원본 엑셀 보기/)
assert.match(pageConfigSource, /"MI_Weekly_2026W32\.html"/)
assert.match(pageConfigSource, /"MI_SigmaIntel\.html"/)
assert.match(pageConfigSource, /"MI_SellThrough\.html"/)
assert.match(pageConfigSource, /"MI_ANI\.html"/)
assert.match(pageConfigSource, /"MI_Insight_Weekly_SellThrough\.html"/)
assert.doesNotMatch(sidebarSource, /weeklyOnly/)
assert.doesNotMatch(sidebarSource, /provider\.page === "weekly"/)
assert.match(
  weeklyAnalysisSource,
  /grid-cols-\[minmax\(0,58fr\)_minmax\(0,42fr\)\] gap-4/
)
assert.equal(
  weeklyAnalysisSource.match(
    /<Card className="min-w-0 border-border shadow-none" size="sm">/g
  )?.length,
  2
)
assert.equal(
  weeklyAnalysisSource.match(
    /<CardTitle className="type-card-title mt-1 tracking-tight">/g
  )?.length,
  2
)
assert.match(weeklyAnalysisSource, /<YAxis hide \/>/)
assert.equal(
  weeklyAnalysisSource.match(/<WeeklyCumulativeChart/g)?.length,
  2,
)
assert.match(weeklyAnalysisSource, /className="h-\[240px\] w-full min-w-0"/)
assert.match(
  weeklyAnalysisSource,
  /grid-cols-\[minmax\(0,1fr\)_120px\] gap-2/
)
assert.match(
  weeklyAnalysisSource,
  /axisLine=\{\{ stroke: "var\(--muted-foreground\)", strokeOpacity: 0\.45 \}\}/
)
assert.match(
  weeklyAnalysisSource,
  /<CardContent className="pt-3">/
)
assert.match(
  weeklyAnalysisSource,
  /<div className="flex h-\[300px\] overflow-hidden border">/
)
assert.equal(
  weeklyAnalysisSource.match(/py-1\.5/g)?.length,
  4,
)
assert.match(
  weeklyAnalysisSource,
  /<table\b(?=[^>]*className="type-table-body h-full w-full border-collapse")[^>]*>/
)
assert.match(
  weeklyAnalysisSource,
  /<ul\s+aria-label="Cumulative composition legend"/
)
assert.match(
  weeklyAnalysisSource,
  /<ul\b(?=[^>]*aria-label="Cumulative composition legend")(?=[^>]*className="type-control flex min-w-0 flex-col gap-1\.5 pt-1 whitespace-nowrap text-muted-foreground")[^>]*>/
)
assert.match(
  weeklyAnalysisSource,
  /<i\b(?=[^>]*aria-hidden="true")(?=[^>]*className="size-1\.5 shrink-0")[^>]*>/
)
assert.match(
  weeklyAnalysisSource,
  /data\.years\[0\]\.segments\.map\(\(segment\) =>/
)
assert.match(weeklyAnalysisSource, /Regional composition/)
assert.match(weeklyAnalysisSource, /Vendor composition/)
assert.match(weeklyAnalysisSource, /value < 0 \? "△"/)
assert.match(weeklyAnalysisSource, /Math\.abs\(value\)\.toFixed\(1\)/)
assert.match(weeklyAnalysisSource, /aria-pressed=\{isSelected\}/)
assert.match(weeklyAnalysisSource, /setSelectedVendor\(vendor\)/)
assert.match(weeklyAnalysisSource, /setSelectedRegion\(regionName\)/)
assert.match(weeklyAnalysisSource, /data=\{selectedTrend\}/)
assert.match(weeklyAnalysisSource, /getWeeklyTrend\(\s*selectedRegion/)
assert.match(weeklyAnalysisSource, /aria-label="Cumulative metric"/)
assert.match(weeklyAnalysisSource, /<ToggleGroupItem id="mu">Mu<\/ToggleGroupItem>/)
assert.match(weeklyAnalysisSource, /<ToggleGroupItem id="share">M\/S \(%\)<\/ToggleGroupItem>/)
assert.match(weeklyAnalysisSource, /metric=\{cumulativeMetric\}/)
assert.doesNotMatch(
  weeklyAnalysisSource,
  /className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground"/
)
assert.match(weeklyAnalysisSource, /selectedVendorLabel\} × \$\{selectedRegionLabel\} weekly sell-out trend/)
assert.doesNotMatch(weeklyAnalysisSource, /Weekly vendor trend/)
assert.doesNotMatch(weeklyAnalysisSource, /aria-label="Trend unit selector"/)
assert.doesNotMatch(weeklyAnalysisSource, /aria-label="Trend vendor selector"/)
assert.doesNotMatch(weeklyAnalysisSource, /aria-label="Cumulative context selector"/)
assert.match(weeklyAnalysisSource, /dot=\{\{ r: 2 \}\}/)
assert.match(weeklyAnalysisSource, /activeDot=\{\{ r: 4 \}\}/)

const expectedPipelineQuarters = [
  "2025 Q1", "2025 Q2", "2025 Q3", "2025 Q4", "2026 Q1", "2026 Q2",
]
const expectedPipelineVendors = ["apple", "samsung", "cnOem"]
const pipelineFlowMetrics = ["production", "sellIn", "sellOut"]
const pipelineInventoryMetrics = ["productionInventory", "channelInventory"]

assert.deepEqual([...pipelineQuarters], expectedPipelineQuarters)
assert.deepEqual(pipelineVendors.map(({ key }) => key), expectedPipelineVendors)
assert.equal(pipelineData.length, 6)
for (const [index, row] of pipelineData.entries()) {
  assert.equal(row.quarter, expectedPipelineQuarters[index])
  for (const metric of pipelineFlowMetrics) {
    assert.deepEqual(Object.keys(row[metric]), expectedPipelineVendors)
    assert.ok(Object.values(row[metric]).every(Number.isFinite))
  }
  for (const metric of pipelineInventoryMetrics) {
    assert.deepEqual(Object.keys(row[metric]), expectedPipelineVendors)
    assert.ok(
      Object.values(row[metric]).every(
        (value) => value === null || Number.isFinite(value),
      ),
    )
  }
}
for (const metric of pipelineFlowMetrics) {
  const chartRows = getPipelineChartData(metric)
  assert.equal(chartRows.length, 6)
  for (const row of chartRows) {
    assert.equal(
      row.total,
      Number(expectedPipelineVendors.reduce((sum, key) => sum + row[key], 0).toFixed(1)),
    )
    assert.ok(row.total <= pipelineYAxisDomain[1])
  }
}
assert.equal(pipelineYAxisDomain[0], 0)
assert.deepEqual(pipelineYAxisTicks, [0, 50, 100, 150, 200, 250, 300, 350])
assert.equal(pipelineExecutiveSummary.length, 3)
assert.match(pipelineExecutiveSummary[0], /309\.0Mu.*298\.0Mu.*291\.0Mu/)
assert.match(pipelineExecutiveSummary[1], /80\.0Mu.*90\.0Mu.*\+7\.0Mu/)
assert.match(pipelineExecutiveSummary[2], /CN OEM.*45\.0Mu.*확인 필요/)

const pipelineSource = readFileSync(
  new URL("../src/components/pipeline-check.tsx", import.meta.url),
  "utf8",
)
const iphonePipelineSource = readFileSync(
  new URL("../src/components/pipeline-check-iphone.tsx", import.meta.url),
  "utf8",
)
assert.match(pipelineSource, /pipelineExecutiveSummary\.map/)
assert.match(
  pipelineSource,
  /grid-cols-\[minmax\(0,1fr\)_210px_minmax\(0,1fr\)_210px_minmax\(0,1fr\)\]/,
)
assert.equal(pipelineSource.match(/domain=\{pipelineYAxisDomain\}/g)?.length, 1)
assert.equal(pipelineSource.match(/ticks=\{pipelineYAxisTicks\}/g)?.length, 1)
assert.match(
  pipelineSource,
  /<YAxis[\s\S]*?fontSize=\{10\}[\s\S]*?domain=\{pipelineYAxisDomain\}/,
)
assert.match(
  pipelineSource,
  /<colgroup>[\s\S]*<col className="w-\[48px\]" \/>[\s\S]*selectedQuarters\.map/,
)
assert.match(pipelineSource, /pipelineVendors\.map/)
assert.match(pipelineSource, /accessibilityLayer/)
assert.match(pipelineSource, /<caption/)
assert.match(pipelineSource, /scope="col"/)
assert.match(pipelineSource, /scope="row"/)
assert.match(
  pipelineSource,
  /value === null \? "N\/A" : `\$\{value\.toFixed\(1\)\}Mu`/,
)
const pipelineOrder = [
  'title="Production"',
  'title="Production Inventory"',
  'title="Sell-in"',
  'title="Channel Inventory"',
  'title="Sell-out"',
]
assert.deepEqual(
  pipelineOrder.map((marker) => pipelineSource.indexOf(marker)),
  [...pipelineOrder.map((marker) => pipelineSource.indexOf(marker))].sort(
    (a, b) => a - b,
  ),
)
assert.ok(pipelineOrder.every((marker) => pipelineSource.indexOf(marker) >= 0))
assert.doesNotMatch(aniChartSource, /vendor-catalog|canonicalVendors/)
assert.doesNotMatch(pipelineSource, /canonicalVendors/)
assert.doesNotMatch(miWeeklySummarySource, /vendor-catalog|canonicalVendors/)

assert.deepEqual([...iphonePipelineQuarters], expectedPipelineQuarters)
assert.equal(iphonePipelineData.length, 6)
assert.deepEqual(
  iphonePipelineLineups.map(({ key }) => key),
  ["n", "nPlus1", "nPlus2", "legacy"],
)
assert.ok(iphonePipelineModels.some(({ type }) => type === "e"))
assert.ok(
  iphonePipelineModels.every((model) =>
    iphonePipelineData.some((row) => row.production[model.key] > 0),
  ),
)
for (const metric of pipelineFlowMetrics) {
  const rows = getIPhonePipelineChartData(metric)
  assert.equal(rows.length, 6)
  assert.ok(rows.every(({ total }) => total > 0))
}
assert.equal(iphonePipelineExecutiveSummary.length, 3)
assert.match(iphonePipelineSource, /PatternDefs/)
assert.match(iphonePipelineSource, /NEW · e/)
assert.match(iphonePipelineSource, /iphonePipelineLineups\.map/)
assert.match(sidebarSource, /Pipeline Check \(iPhone\)/)
assert.match(appSource, /<PipelineCheckIPhone \/>/)
assert.match(pageConfigSource, /"MI_TAM_Pipeline_Check_iPhone\.html"/)
assert.deepEqual(getDefaultInventoryQuarters(pipelineQuarters), [
  "2025 Q2",
  "2026 Q1",
  "2026 Q2",
])
assert.equal(pipelineSource.match(/<InventoryQuarterSelect/g)?.length, 1)
assert.equal(iphonePipelineSource.match(/<InventoryQuarterSelect/g)?.length, 1)
assert.match(pipelineSource, /selectedQuarters=\{selectedInventoryQuarters\}/)
assert.match(iphonePipelineSource, /selectedQuarters=\{selectedInventoryQuarters\}/)

console.log("production and weekly data checks passed")
