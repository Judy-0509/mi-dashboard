import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

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
  oppo: 0.5,
  vivo: 0.4,
  transsion: 0.3,
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
  oppo: 14,
  vivo: 15,
  transsion: 16,
  others: 17,
})

const approximatelyEqual = (actual, expected, tolerance = 0.0005) =>
  Math.abs(actual - expected) <= tolerance
const weeklyTotal = getWeeklyCumulative("Total")
const appleRegional = getWeeklyRegionalCumulative(0)
const usaVendor = getWeeklyVendorCumulative("USA")

assert.equal(getWeeklyHeatmap("yoy").length, 8)
assert.ok(getWeeklyHeatmap("wow").every((row) => row.values.length === 6))
assert.deepEqual(appleRegional.segmentNames, weeklyRegions.slice(1))
assert.deepEqual(usaVendor.segmentNames, weeklyVendors)
const appleUsa = sumWeeklySellOut(
  2026,
  weeklySelectedWeek,
  "USA",
  0,
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

const totalWeeklyTrend = getWeeklyTrend("Total", null, "mu")
assert.equal(totalWeeklyTrend.length, 52)
assert.equal(totalWeeklyTrend[0].week, "W01")
assert.equal(totalWeeklyTrend[51].week, "W52")
assert.ok(totalWeeklyTrend[31].y2026 > 0)
assert.equal(totalWeeklyTrend[32].y2026, null)
assert.ok(totalWeeklyTrend[51].y2023 > 0)
assert.ok(totalWeeklyTrend[51].y2024 > 0)
assert.ok(totalWeeklyTrend[51].y2025 > 0)

const usaAppleShareTrend = getWeeklyTrend("USA", 0, "share")
assert.ok(
  usaAppleShareTrend
    .slice(0, weeklySelectedWeek)
    .every((point) => point.y2026 > 0 && point.y2026 < 100)
)
assert.equal(usaAppleShareTrend[weeklySelectedWeek].y2026, null)
const usaAppleMuTrend = getWeeklyTrend("USA", 0, "mu")
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

assert.match(sidebarSource, /PortalPage = "sigma" \| "weekly" \| "ani"/)
assert.match(sidebarSource, /label: "ANI"/)
assert.match(sidebarSource, /child: "iPhone Model Production"/)
assert.match(sidebarSource, /page: "ani"/)
assert.match(sidebarSource, /href: "#ani"/)
assert.match(appSource, /window\.location\.hash === "#ani"/)
assert.match(appSource, /page === "ani"/)
assert.match(appSource, /function AniPage\(\)/)
assert.match(appSource, /<AniPage \/>/)
assert.match(appSource, /<AniProductionChart \/>/)
assert.match(appSource, /ANI \/ iPhone Model Production/)
assert.match(appSource, /iPhone 모델 생산 전망/)
assert.match(appSource, /2024 Q1–2027 Q2 분기별 Forecast · 단위: Mu/)
assert.match(appSource, /activePage === "ani"/)

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
assert.match(appSource, /window\.__MI_WEEKLY_EXPORT__ === true/)
assert.match(appSource, /download="MI_Weekly_2026W32\.html"/)
assert.match(appSource, /href="\.\/MI_Weekly_2026W32\.html"/)
assert.match(appSource, /!isWeeklyExport/)
assert.match(appSource, /isWeeklyExport \? null/)
assert.match(appSource, /원본 엑셀 보기/)
assert.match(appSource, /aria-disabled="true"/)
assert.match(appSource, /사내 EDM 원본 엑셀 링크가 아직 설정되지 않았습니다\./)
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
    /<CardTitle className="mt-1 text-xl font-semibold tracking-tight group-data-\[size=sm\]\/card:text-xl">/g
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
  /<table\b(?=[^>]*className="h-full w-full border-collapse text-xs")[^>]*>/
)
assert.match(
  weeklyAnalysisSource,
  /<ul\s+aria-label="Cumulative composition legend"/
)
assert.match(
  weeklyAnalysisSource,
  /<ul\b(?=[^>]*aria-label="Cumulative composition legend")(?=[^>]*className="flex min-w-0 flex-col gap-1\.5 pt-1 text-xs leading-4 whitespace-nowrap text-muted-foreground")[^>]*>/
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

console.log("production and weekly data checks passed")
