import { readdir, readFile, stat, writeFile } from "node:fs/promises"
import path from "node:path"
import { pathToFileURL } from "node:url"

import {
  canonicalVendors,
  normalizeProviderValue,
  normalizeProviderVendorName,
} from "../src/data/vendor-catalog.ts"

const vendorKeys = [...canonicalVendors.map(({ key }) => key), "others"]
const vendorLabels = Object.fromEntries([
  ...canonicalVendors.map(({ key, label }) => [key, label]),
  ["others", "Others"],
])
const providerAliases = Object.fromEntries(
  canonicalVendors.map(({ key }) => [key, key]),
)
const appRoot = path.resolve(import.meta.dirname, "..")
const repositoryRoot = path.resolve(appRoot, "../..")
const outputPath = path.join(appRoot, "src", "data", "dashboard.json")
export function parseCsv(text) {
  const rows = []
  let row = []
  let field = ""
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (character === "," && !quoted) {
      row.push(field.trim())
      field = ""
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1
      row.push(field.trim())
      if (row.some(Boolean)) rows.push(row)
      row = []
      field = ""
    } else {
      field += character
    }
  }

  row.push(field.trim())
  if (row.some(Boolean)) rows.push(row)
  if (quoted || rows.length < 2)
    throw new Error("CSV 형식을 확인할 수 없습니다")

  const headers = rows[0].map((header) => header.toLowerCase())
  return rows
    .slice(1)
    .map((values) =>
      Object.fromEntries(
        headers.map((header, index) => [header, values[index]])
      )
    )
}

async function collectDataFiles(directory) {
  const candidates = []
  const ignored = new Set([".git", "node_modules", "dist", "site"])

  async function visit(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      if (ignored.has(entry.name)) continue
      const target = path.join(current, entry.name)
      if (entry.isDirectory()) await visit(target)
      else if (/\.(csv|json)$/i.test(entry.name)) {
        candidates.push({
          path: target,
          modified: (await stat(target)).mtimeMs,
        })
      }
    }
  }

  await visit(directory)
  const named = candidates.filter((candidate) =>
    /(dashboard|production|sigma)/i.test(path.basename(candidate.path))
  )
  const eligible = named.length ? named : candidates
  eligible.sort(
    (left, right) =>
      right.modified - left.modified || left.path.localeCompare(right.path)
  )
  if (!eligible.length)
    throw new Error(`JSON 또는 CSV 파일을 찾을 수 없습니다: ${directory}`)
  return eligible[0].path
}

async function readSource(source) {
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source, {
      signal: AbortSignal.timeout(30_000),
    })
    if (!response.ok)
      throw new Error(`데이터 다운로드 실패: HTTP ${response.status}`)
    const text = await response.text()
    if (text.length > 10_000_000)
      throw new Error("데이터 파일은 10MB 이하여야 합니다")
    return {
      text,
      extension: path.extname(new URL(source).pathname).toLowerCase(),
    }
  }

  if (path.win32.isAbsolute(source) && process.platform !== "win32") {
    throw new Error(
      "Windows/사내 경로는 해당 경로에 접근 가능한 self-hosted Windows runner가 필요합니다"
    )
  }

  let target = path.isAbsolute(source)
    ? source
    : path.resolve(repositoryRoot, source)
  const sourceStats = await stat(target).catch(() => null)
  if (!sourceStats) throw new Error(`데이터 경로를 찾을 수 없습니다: ${target}`)
  if (sourceStats.isDirectory()) target = await collectDataFiles(target)
  const text = await readFile(target, "utf8")
  console.log(`데이터 파일: ${target}`)
  return { text, extension: path.extname(target).toLowerCase() }
}

export function normalizeRow(input, index) {
  const row = Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key.toLowerCase(), value])
  )
  const quarter = String(row.quarter ?? "")
    .trim()
    .toUpperCase()
  if (!/^\d{4} Q[1-4]$/.test(quarter)) {
    throw new Error(
      `${index + 1}번째 행의 quarter는 '2026 Q3' 형식이어야 합니다`
    )
  }

  const normalized = Object.fromEntries([
    ["quarter", quarter],
    ...vendorKeys.map((key) => [key, null]),
  ])
  const dataErrors = []
  const seenKeys = new Set()
  for (const [providerKey, rawValue] of Object.entries(row)) {
    if (providerKey === "quarter") continue
    const normalizedProviderKey = providerKey
      .trim()
      .toLowerCase()
      .replace(/[\s\p{P}\p{S}]+/gu, "")
    const key =
      normalizedProviderKey === "others"
        ? "others"
        : normalizeProviderVendorName(providerKey, providerAliases)
    if (!key) {
      dataErrors.push(`${quarter}: unmapped vendor column ${providerKey}`)
      continue
    }
    if (seenKeys.has(key)) {
      dataErrors.push(`${quarter}: conflicting vendor column ${providerKey}`)
      continue
    }
    seenKeys.add(key)
    const value = normalizeProviderValue(rawValue, (raw) => {
      if (typeof raw === "number") {
        return Number.isFinite(raw) && raw >= 0 ? raw : null
      }
      if (typeof raw === "string" && raw.trim()) {
        const parsed = Number(raw)
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
      }
      return null
    })
    if (value.status === "available") {
      normalized[key] = value.value
    } else if (rawValue !== "" && rawValue !== null && rawValue !== undefined) {
      dataErrors.push(`${quarter}: malformed value for ${providerKey}`)
    }
  }
  return dataErrors.length ? { ...normalized, dataErrors } : normalized
}

function quarterIndex(quarter) {
  const [year, label] = quarter.split(" ")
  return Number(year) * 4 + Number(label.slice(1))
}

function total(row) {
  const values = vendorKeys
    .map((key) => row[key])
    .filter((value) => typeof value === "number" && Number.isFinite(value))
  return values.length ? values.reduce((sum, value) => sum + value, 0) : null
}

function createSummary(rows, focusQuarter) {
  const index = rows.findIndex((row) => row.quarter === focusQuarter)
  const focus = rows[index]
  const previous = rows[index - 1]
  const focusTotal = total(focus)
  const largestKey = vendorKeys
    .filter((key) => typeof focus[key] === "number")
    .reduce((largest, key) =>
      focus[key] > focus[largest] ? key : largest
    , vendorKeys[0])
  const change =
    previous && focusTotal !== null && total(previous) !== null
      ? focusTotal - total(previous)
      : null
  const changeText = previous
    ? change === null
      ? "직전 분기와 비교 가능한 데이터가 없음"
      : `직전 분기 대비 ${change >= 0 ? "+" : ""}${change.toFixed(1)}Mu 조정됨`
    : "비교 가능한 직전 분기 데이터가 없음"

  return [
    `${focusQuarter} 현재 누적 Forecast는 ${focusTotal === null ? "데이터 없음" : `${focusTotal.toFixed(1)}Mu`}, ${changeText}`,
    largestKey && typeof focus[largestKey] === "number"
      ? `${vendorLabels[largestKey]} ${focus[largestKey].toFixed(1)}Mu로 업체 중 가장 큰 비중임`
      : "업체별 데이터 없음",
  ]
}

async function main() {
  const sourceArgument = process.argv[2] ?? process.env.DASHBOARD_DATA_SOURCE
  const checkOnly = process.argv.includes("--check")
  if (!sourceArgument) {
    throw new Error(
      "데이터 경로가 필요합니다: npm run data:update -- <JSON 또는 CSV 경로/URL>"
    )
  }

  const { text, extension } = await readSource(sourceArgument)
  const parsed = extension === ".csv" ? parseCsv(text) : JSON.parse(text)
  const inputRows = Array.isArray(parsed) ? parsed : parsed.quarterlyProduction
  if (!Array.isArray(inputRows) || !inputRows.length) {
    throw new Error("quarterlyProduction 데이터가 비어 있습니다")
  }

  const normalizedRows = inputRows
    .map(normalizeRow)
  const dataErrors = normalizedRows.flatMap((row) => row.dataErrors ?? [])
  const quarterlyProduction = normalizedRows.map(({ dataErrors: _dataErrors, ...row }) => row)
  quarterlyProduction.sort(
    (left, right) => quarterIndex(left.quarter) - quarterIndex(right.quarter)
  )
  if (
    new Set(quarterlyProduction.map((row) => row.quarter)).size !==
    quarterlyProduction.length
  ) {
    throw new Error("중복된 quarter가 있습니다")
  }

  const asOf = Array.isArray(parsed)
    ? new Date().toISOString().slice(0, 10)
    : parsed.asOf
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf ?? "")) {
    throw new Error("asOf는 '2026-08-10' 형식이어야 합니다")
  }

  const requestedFocus = Array.isArray(parsed) ? undefined : parsed.focusQuarter
  const focusQuarter = requestedFocus ?? quarterlyProduction.at(-1).quarter
  if (!quarterlyProduction.some((row) => row.quarter === focusQuarter)) {
    throw new Error(
      `focusQuarter가 quarterlyProduction에 없습니다: ${focusQuarter}`
    )
  }

  const suppliedSummary = Array.isArray(parsed)
    ? undefined
    : parsed.executiveSummary
  const executiveSummary =
    Array.isArray(suppliedSummary) &&
    suppliedSummary.length >= 1 &&
    suppliedSummary.length <= 3
      ? suppliedSummary.map(String)
      : createSummary(quarterlyProduction, focusQuarter)

  const normalized = {
    asOf,
    focusQuarter,
    executiveSummary,
    quarterlyProduction,
    ...(dataErrors.length ? { dataErrors } : {}),
  }
  if (!checkOnly)
    await writeFile(
      outputPath,
      `${JSON.stringify(normalized, null, 2)}\n`,
      "utf8"
    )
  console.log(
    `${quarterlyProduction.length}개 분기 데이터 검증 완료${checkOnly ? "" : `: ${outputPath}`}`
  )
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  await main()
}
