import { createHash } from "node:crypto"
import { rename, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import dashboardData from "../src/data/dashboard.json" with { type: "json" }
import {
  aniFocusQuarter,
  aniModels,
  getAniForecastHistory,
  getAniHistorySummary,
} from "../src/data/ani.ts"
import {
  flagshipSalesMonths,
  flagshipSalesVendors,
  getFlagshipSalesChartData,
  getFlagshipSalesGenerationComparison,
} from "../src/data/flagship-sales.ts"
import {
  getResultCellState,
  latestResultsDataset,
} from "../src/data/latest-results.ts"
import { latestResultsIPhoneDataset } from "../src/data/latest-results-iphone.ts"
import { miInsightInsights } from "../src/data/mi-insight.ts"
import { miWeeklySellThroughDetails } from "../src/data/mi-weekly-sell-through.ts"
import {
  pipelineData,
  pipelineExecutiveSummary,
  pipelineVendors,
} from "../src/data/pipeline-check.ts"
import {
  iphonePipelineData,
  iphonePipelineExecutiveSummary,
  iphonePipelineModels,
} from "../src/data/pipeline-check-iphone.ts"
import {
  getSellThroughTotals,
  inventorySnapshots,
  sellThroughMonthly,
} from "../src/data/sell-through.ts"
import {
  getWeeklyMetric,
  weeklyExecutiveSummary,
  weeklyRegions,
  weeklySelectedWeek,
} from "../src/data/weekly.ts"

export const repositoryRoot = path.resolve(import.meta.dirname, "../../..")
const outputPath = path.join(repositoryRoot, "editorial-defaults.json")
const regions = ["Total", "USA", "China", "Japan", "Europe", "India"]
const pageKinds = {
  sigma: "bullets",
  weekly: "bullets",
  ani: "bullets",
  "sell-through": "bullets",
  "flagship-sales": "bullets",
  "pipeline-check": "bullets",
  "pipeline-check-iphone": "bullets",
  "latest-results": "bullets",
  "latest-results-iphone": "bullets",
  "mi-insight": "titled",
  "mi-weekly-sell-through": "regional",
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    )
  }
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new Error("Revision data must contain finite numbers")
  }
  if (["string", "number", "boolean"].includes(typeof value) || value === null) {
    return value
  }
  throw new Error(`Unsupported revision value: ${typeof value}`)
}

export function stableStringify(value) {
  return JSON.stringify(canonicalize(value))
}

export function createRevision(value) {
  return `sha256:${createHash("sha256").update(stableStringify(value)).digest("hex")}`
}

function formatMu(value) {
  return `${value.toFixed(1)}Mu`
}

function formatSigned(value, suffix = "Mu") {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}${suffix}`
}

function availableValue(value) {
  return value.status === "available" ? value.value : null
}

function sumAvailable(values) {
  const available = values.filter((value) => value !== null)
  return available.length
    ? available.reduce((total, value) => total + value, 0)
    : null
}

function averageAvailable(values) {
  const available = values.filter((value) => value !== null)
  return available.length
    ? available.reduce((total, value) => total + value, 0) / available.length
    : null
}

function aniSource() {
  const visibleKeys = aniModels.map(({ key }) => key)
  const history = getAniForecastHistory(aniFocusQuarter)
  const summary = getAniHistorySummary(history, visibleKeys)
  return {
    kind: "bullets",
    revisionData: { focusQuarter: aniFocusQuarter, history, visibleKeys },
    content: [
      `${aniFocusQuarter} iPhone 전체 생산 Forecast는 ${formatMu(summary.currentTotal)}임`,
      `최근 월간 조정은 ${formatSigned(summary.monthOverMonth)}, 6개월 전 대비 ${formatSigned(summary.sixMonth)}임`,
    ],
  }
}

function sellThroughSource() {
  const latest = sellThroughMonthly.at(-1)
  const totals = getSellThroughTotals(latest)
  const inventory = [0, 1, 2].map((index) =>
    sumAvailable(
      inventorySnapshots.map((row) => availableValue(row.inventory[index])),
    ),
  )
  const wos = [0, 1, 2].map((index) =>
    averageAvailable(
      inventorySnapshots.map((row) => availableValue(row.wos[index])),
    ),
  )
  return {
    kind: "bullets",
    revisionData: { latest, inventorySnapshots },
    content: [
      `${latest.month} Sell-in ${formatMu(totals.sellIn)}, Sell-through ${formatMu(totals.sellThrough)}, SI/ST 비율 ${totals.ratio.toFixed(1)}%임`,
      `전체 Inventory는 ${formatMu(inventory[2])}로 4월 대비 ${formatSigned(inventory[2] - inventory[1])}, 평균 WoS는 ${wos[2].toFixed(1)}주로 ${formatSigned(wos[2] - wos[1], "주")} 변화함`,
    ],
  }
}

function flagshipSource() {
  const vendorLatest = flagshipSalesVendors
    .filter(({ availability }) => availability === "available")
    .map((vendor) => ({
      key: vendor.key,
      label: vendor.label,
      value:
        getFlagshipSalesChartData(
          vendor.key,
          "calendar",
          vendor.models.map(({ key }) => key),
        ).at(-1)?.total ?? 0,
    }))
  const total = vendorLatest.reduce((sum, item) => sum + item.value, 0)
  const leader = vendorLatest.reduce((largest, item) =>
    item.value > largest.value ? item : largest,
  )
  const comparisons = flagshipSalesVendors
    .map((vendor) => ({
      vendor: vendor.label,
      comparison: getFlagshipSalesGenerationComparison(vendor.key),
    }))
    .filter(({ comparison }) => comparison !== null)
    .map(({ vendor, comparison }) => ({
      vendor,
      label: `${comparison.currentGenerationLabel} vs ${comparison.previousGenerationLabel}`,
      deltaMu: comparison.rows[0].deltaMu,
    }))
  const highest = comparisons.reduce((largest, item) =>
    item.deltaMu > largest.deltaMu ? item : largest,
  )
  const lowest = comparisons.reduce((smallest, item) =>
    item.deltaMu < smallest.deltaMu ? item : smallest,
  )
  return {
    kind: "bullets",
    revisionData: {
      month: flagshipSalesMonths.at(-1),
      vendorLatest,
      comparisons,
    },
    content: [
      `${flagshipSalesMonths.at(-1)} Flagship 판매는 ${formatMu(total)}, ${leader.label} ${formatMu(leader.value)}로 업체 중 가장 큼`,
      `세대 비교 변화는 ${highest.label} ${formatSigned(highest.deltaMu)} (${highest.vendor})가 최대, ${lowest.label} ${formatSigned(lowest.deltaMu)} (${lowest.vendor})가 최소임`,
    ],
  }
}

function pipelineRevisionData() {
  return { pipelineData, pipelineVendors }
}

function iphonePipelineRevisionData() {
  return { iphonePipelineData, iphonePipelineModels }
}

function latestResultsSource(dataset, label) {
  const quarter = dataset.quarters.at(-1)
  const counts = { actual: 0, forecast: 0, missing: 0 }
  const coverage = dataset.agencies.map((agency) => {
    const agencyCounts = { actual: 0, forecast: 0, missing: 0 }
    for (const rowKey of dataset.rowKeys) {
      const state = getResultCellState(agency.cells[quarter][rowKey])
      counts[state] += 1
      agencyCounts[state] += 1
    }
    return {
      agency: agency.label,
      filled: agencyCounts.actual + agencyCounts.forecast,
      total: dataset.rowKeys.length,
    }
  })
  const coverageValues = coverage.map(({ filled }) => filled)
  return {
    kind: "bullets",
    revisionData: {
      quarter,
      rowKeys: dataset.rowKeys,
      agencies: dataset.agencies.map(({ key, cells }) => ({ key, cells })),
    },
    content: [
      `${quarter} ${label} 입력은 Actual ${counts.actual}건, Forecast ${counts.forecast}건, 미입력 ${counts.missing}건임`,
      `조사기관별 입력 범위는 ${Math.min(...coverageValues)}~${Math.max(...coverageValues)}개 항목이며 총 ${dataset.rowKeys.length}개 항목을 비교함`,
    ],
  }
}

export function getEditorialDefaultSources() {
  const weeklyMetrics = {
    week: weeklySelectedWeek,
    regions: weeklyRegions.map((region) => ({
      region,
      yoy: getWeeklyMetric(weeklySelectedWeek, region, null, "yoy"),
      wow: getWeeklyMetric(weeklySelectedWeek, region, null, "wow"),
    })),
  }
  return {
    sigma: {
      kind: "bullets",
      revisionData: {
        asOf: dashboardData.asOf,
        focusQuarter: dashboardData.focusQuarter,
        executiveSummary: dashboardData.executiveSummary,
        quarterlyProduction: dashboardData.quarterlyProduction,
      },
      content: dashboardData.executiveSummary,
    },
    weekly: {
      kind: "bullets",
      revisionData: weeklyMetrics,
      content: weeklyExecutiveSummary,
    },
    ani: aniSource(),
    "sell-through": sellThroughSource(),
    "flagship-sales": flagshipSource(),
    "pipeline-check": {
      kind: "bullets",
      revisionData: pipelineRevisionData(),
      content: pipelineExecutiveSummary,
    },
    "pipeline-check-iphone": {
      kind: "bullets",
      revisionData: iphonePipelineRevisionData(),
      content: iphonePipelineExecutiveSummary,
    },
    "latest-results": latestResultsSource(latestResultsDataset, "업체별 실적"),
    "latest-results-iphone": latestResultsSource(
      latestResultsIPhoneDataset,
      "iPhone 모델 실적",
    ),
    "mi-insight": {
      kind: "titled",
      revisionData: miInsightInsights,
      content: miInsightInsights,
    },
    "mi-weekly-sell-through": {
      kind: "regional",
      revisionData: {
        weeklyMetrics,
        details: miWeeklySellThroughDetails,
      },
      content: miWeeklySellThroughDetails,
    },
  }
}

function validateSentence(value, label, maximum) {
  if (typeof value !== "string" || value.trim().length < 1 || value.trim().length > maximum) {
    throw new Error(`${label} must be 1-${maximum} characters`)
  }
}

function validateContent(kind, content) {
  if (kind === "bullets") {
    if (!Array.isArray(content) || content.length < 1 || content.length > 3) {
      throw new Error("bullets must contain 1-3 items")
    }
    content.forEach((item) => validateSentence(item, "bullet", 500))
    return
  }
  if (kind === "titled") {
    if (!Array.isArray(content) || content.length < 1 || content.length > 3) {
      throw new Error("titled content must contain 1-3 sections")
    }
    for (const section of content) {
      validateSentence(section?.title, "title", 100)
      if (!Array.isArray(section?.details) || section.details.length < 1 || section.details.length > 5) {
        throw new Error("titled details must contain 1-5 items")
      }
      section.details.forEach((item) => validateSentence(item, "detail", 500))
    }
    return
  }
  if (
    !content ||
    typeof content !== "object" ||
    Array.isArray(content) ||
    stableStringify(Object.keys(content)) !== stableStringify(regions)
  ) {
    throw new Error("regional content keys are invalid")
  }
  for (const region of regions) {
    if (!Array.isArray(content[region]) || content[region].length > 3) {
      throw new Error("regional details must contain 0-3 items")
    }
    content[region].forEach((item) => validateSentence(item, "regional detail", 500))
  }
}

export function createEditorialManifest(sources) {
  const pages = Object.fromEntries(
    Object.entries(sources).map(([page, source]) => [
      page,
      {
        kind: source.kind,
        dataRevision: createRevision(source.revisionData),
        content: structuredClone(source.content),
      },
    ]),
  )
  return { schemaVersion: 1, pages }
}

export function validateEditorialManifest(manifest) {
  if (manifest?.schemaVersion !== 1 || stableStringify(Object.keys(manifest.pages ?? {})) !== stableStringify(Object.keys(pageKinds))) {
    throw new Error("editorial manifest page keys are invalid")
  }
  for (const [page, kind] of Object.entries(pageKinds)) {
    const item = manifest.pages[page]
    if (item.kind !== kind || !/^sha256:[0-9a-f]{64}$/.test(item.dataRevision)) {
      throw new Error(`invalid editorial manifest entry: ${page}`)
    }
    validateContent(kind, item.content)
  }
}

export async function buildEditorialDefaults() {
  const manifest = createEditorialManifest(getEditorialDefaultSources())
  validateEditorialManifest(manifest)
  const temporaryPath = `${outputPath}.tmp`
  await writeFile(temporaryPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8")
  await rename(temporaryPath, outputPath)
  return outputPath
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(await buildEditorialDefaults())
}
