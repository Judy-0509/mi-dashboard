# Standard Vendor Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize vendor identity, order, colors, availability, and missing-value behavior across SigmaIntel Production, Counterpoint Weekly, Sell In/Sell Through, and Flagship Sales without changing non-vendor pages.

**Architecture:** Create one typed catalog and normalization boundary. Existing dataset modules become thin adapters that emit catalog-first records; the four existing components consume those records and keep their current layout, colors, and chart libraries. The existing checker remains the executable contract and the existing Vite/export build regenerates tracked standalone pages.

**Tech Stack:** React 19, TypeScript, Recharts, React Aria Components, Vite 8, existing shadcn/ui primitives, Node `assert/strict`, and the current static HTML exporter.

## Global Constraints

- Canonical order and labels are exactly `apple/Apple`, `samsung/Samsung`, `xiaomi/Xiaomi`, `huawei/Huawei`, `honor/Honor`, `oppo/OPPO`, `vivo/vivo`, `transsion/Transsion`, `lenovo/Lenovo`, `google/Google`.
- Keys are lowercase and stable; adapters resolve provider aliases, capitalization, spacing, and punctuation before UI rendering.
- `VendorValue<T>` distinguishes available values from unavailable values; explicit `0` is available, while missing, null, malformed, unmapped, or conflicting values are unavailable.
- Each adapter exposes canonical values and dataset additions separately; UI order is canonical catalog first, then additions in source-defined order.
- Components iterate the ten canonical entries first and `Others` second for Production, Weekly, and Sell In/Sell Through; Flagship has no addition.
- Unavailable values render `—` and accessible `데이터 없음`, disable controls, create no chart point/segment, and contribute to no totals, denominators, rankings, or axis domains; an aggregate with no available inputs is `null`, not numeric zero.
- Preserve every approved existing color; assign stable shared tokens to newly covered vendors from the existing palette without a redesign.
- Do not add vendor rows or controls to ANI model-series, MI TAM aggregate-group, or vendorless report-only pages; do not add dependencies, routes, backend calls, or a new exporter.
- Run package commands from `prototype/mi-dashboard-shadcn`; do not stage or modify `.superpowers/`.

## File Map

- Create `prototype/mi-dashboard-shadcn/src/data/vendor-catalog.ts` for canonical metadata, `VendorValue<T>`, aliases, parsing, and catalog-plus-additions.
- Task 1 modifies `prototype/mi-dashboard-shadcn/scripts/check-production.mjs` only for shared-catalog assertions.
- Task 2 modifies `prototype/mi-dashboard-shadcn/package.json`, `scripts/update-dashboard-data.mjs`, `src/data/production.ts`, `weekly.ts`, `sell-through.ts`, `flagship-sales.ts`, the four vendor components, and the checker’s adapter/component assertions.
- Regenerate only the tracked `site/index.html`, `site/assets/index-*.js`, `site/assets/index-*.css`, and the eight listed `site/MI_*.html` files.

### Task 1: Add the shared catalog and normalization boundary

**Files:**
- Create: `prototype/mi-dashboard-shadcn/src/data/vendor-catalog.ts`
- Modify: `prototype/mi-dashboard-shadcn/scripts/check-production.mjs`

**Interfaces:**

```ts
export interface VendorCatalogEntry { readonly key: string; readonly label: string; readonly color: string }
export type CanonicalVendorKey = "apple" | "samsung" | "xiaomi" | "huawei" | "honor" | "oppo" | "vivo" | "transsion" | "lenovo" | "google"
export const canonicalVendors: readonly (VendorCatalogEntry & { readonly key: CanonicalVendorKey })[]
export type VendorStatus = "available" | "unavailable"
export type VendorValue<T> =
  | { status: "available"; value: T }
  | { status: "unavailable"; value: null }
export function normalizeProviderVendorName(name: unknown, aliases: Readonly<Record<string, CanonicalVendorKey>>): CanonicalVendorKey | null
export function normalizeProviderValue<T>(raw: unknown, parse: (raw: unknown) => T | null): VendorValue<T>
export function withVendorAdditions(additions: readonly VendorCatalogEntry[]): readonly VendorCatalogEntry[]
```

- [ ] **Step 1: Add the RED assertions before implementation.** Import the three helpers and catalog in `check-production.mjs`, then add:

```js
assert.deepEqual(canonicalVendors.map(({ key }) => key), ["apple", "samsung", "xiaomi", "huawei", "honor", "oppo", "vivo", "transsion", "lenovo", "google"])
assert.deepEqual(canonicalVendors.map(({ label }) => label), ["Apple", "Samsung", "Xiaomi", "Huawei", "Honor", "OPPO", "vivo", "Transsion", "Lenovo", "Google"])
assert.equal(normalizeProviderVendorName(" HON-OR ", { honor: "honor" }), "honor")
assert.equal(normalizeProviderVendorName("unknown vendor", { honor: "honor" }), null)
assert.deepEqual(normalizeProviderValue(0, (raw) => typeof raw === "number" ? raw : null), { status: "available", value: 0 })
assert.deepEqual(normalizeProviderValue(null, (raw) => typeof raw === "number" ? raw : null), { status: "unavailable", value: null })
assert.equal(withVendorAdditions([{ key: "others", label: "Others", color: "var(--chart-7)" }]).at(-1).key, "others")
assert.throws(() => withVendorAdditions([{ key: "apple", label: "Duplicate", color: "var(--chart-7)" }]), /duplicate vendor key/i)
```

- [ ] **Step 2: Run the RED check.** From `prototype/mi-dashboard-shadcn`, run `node --experimental-strip-types scripts/check-production.mjs`; expect the missing `vendor-catalog.ts` import to fail.

- [ ] **Step 3: Implement the minimal catalog.** Define the ten entries in the exact order with `as const satisfies readonly VendorCatalogEntry[]`, keeping Apple/Samsung/Xiaomi/OPPO/vivo/Transsion’s existing `var(--chart-1)`–`var(--chart-6)` tokens, existing approved Flagship colors for Honor/Google, and existing palette tokens for Huawei/Lenovo. Normalize names with `trim().toLowerCase()` plus separator removal; look up the normalized alias and return `null` for unknown input. Run the parser, reject `undefined`, `null`, non-finite numbers, and parser `null`, but keep numeric zero available. Return canonical entries followed by additions in supplied order, throwing on any duplicate canonical or addition key.

- [ ] **Step 4: Run GREEN and commit the shared boundary.** Run `npm.cmd test` and `npm.cmd run typecheck` from `prototype/mi-dashboard-shadcn`; both must pass with the new assertions. From the repository root:

```powershell
git add prototype/mi-dashboard-shadcn/src/data/vendor-catalog.ts prototype/mi-dashboard-shadcn/scripts/check-production.mjs
git diff --cached --check
git commit -m "feat: add shared vendor catalog"
```

### Task 2: Adapt datasets/components, test semantics, and rebuild exports

**Files:**
- Modify: `prototype/mi-dashboard-shadcn/package.json`
- Modify: `prototype/mi-dashboard-shadcn/scripts/update-dashboard-data.mjs`
- Modify: `prototype/mi-dashboard-shadcn/src/data/production.ts`
- Modify: `prototype/mi-dashboard-shadcn/src/data/weekly.ts`
- Modify: `prototype/mi-dashboard-shadcn/src/data/sell-through.ts`
- Modify: `prototype/mi-dashboard-shadcn/src/data/flagship-sales.ts`
- Modify: `prototype/mi-dashboard-shadcn/src/components/cumulative-production-chart.tsx`
- Modify: `prototype/mi-dashboard-shadcn/src/components/weekly-analysis.tsx`
- Modify: `prototype/mi-dashboard-shadcn/src/components/sell-through-analysis.tsx`
- Modify: `prototype/mi-dashboard-shadcn/src/components/flagship-sales-chart.tsx`
- Modify: `prototype/mi-dashboard-shadcn/scripts/check-production.mjs`
- Regenerate: `site/index.html`, `site/assets/index-*.js`, `site/assets/index-*.css`, `site/MI_SigmaIntel.html`, `site/MI_Weekly_2026W32.html`, `site/MI_SellThrough.html`, `site/MI_Counterpoint_Flagship_Sales.html`, `site/MI_ANI.html`, `site/MI_Insight_Weekly_Report.html`, `site/MI_Insight_Weekly_SellThrough.html`, `site/MI_TAM_Pipeline_Check.html`

**Interfaces:** Keep existing non-vendor exports, and add these normalized contracts:

```ts
type VendorKey = CanonicalVendorKey | "others"
export type QuarterlyProduction = { quarter: string } & Record<VendorKey, VendorValue<number>>
export type ForecastHistoryPoint = QuarterlyProduction & { period: string }
export const vendors: readonly (VendorCatalogEntry & { availability: VendorStatus })[]
export function getProductionTotal(item: QuarterlyProduction): number | null
export function getVisibleVendorTotal(item: QuarterlyProduction, keys: readonly VendorKey[]): number | null
export function getVendorHistoryDeltas(history: readonly ForecastHistoryPoint[]): Record<VendorKey, number | null>
export type WeeklyVendorKey = CanonicalVendorKey | "others"
export const weeklyVendors: readonly (VendorCatalogEntry & { availability: VendorStatus; providerIndex: number | null })[]
export function sumWeeklySellOut(year: number, week: number, region: WeeklyRegion, key: WeeklyVendorKey | null, cumulative: boolean): number | null
export function getWeeklyHeatmap(metric: WeeklyMetric): readonly { key: WeeklyVendorKey | "total"; label: string; values: readonly (number | null)[] }[]
export function getWeeklyTrend(region: WeeklyRegion, key: WeeklyVendorKey | null, metric: WeeklyTrendMetric): readonly WeeklyTrendPoint[]
export type SellThroughVendorKey = CanonicalVendorKey | "others"
export interface SellThroughVendorMonth { month: SellThroughMonth; sellIn: Record<SellThroughVendorKey, VendorValue<number>>; sellThrough: Record<SellThroughVendorKey, VendorValue<number>> }
export interface InventorySnapshotRow { vendor: SellThroughVendorKey; inventory: readonly [VendorValue<number>, VendorValue<number>, VendorValue<number>]; wos: readonly [VendorValue<number>, VendorValue<number>, VendorValue<number>] }
export const sellThroughVendors: readonly (VendorCatalogEntry & { availability: VendorStatus })[]
export interface SellThroughTotals { sellIn: number | null; sellThrough: number | null; ratio: number | null }
export function getSellThroughTotals(point: SellThroughVendorMonth): SellThroughTotals
export function getSellThroughVendorTotals(point: SellThroughVendorMonth, keys?: readonly SellThroughVendorKey[]): SellThroughTotals
export type FlagshipSalesVendorKey = CanonicalVendorKey
export interface FlagshipSalesVendor extends VendorCatalogEntry { availability: VendorStatus; models: readonly FlagshipSalesModel[] }
export const flagshipSalesVendors: readonly FlagshipSalesVendor[]
export function getFlagshipSalesVendorTotal(key: FlagshipSalesVendorKey, view: FlagshipSalesView, modelKeys: readonly string[]): number | null
export function getFlagshipSalesGenerationComparison(key: FlagshipSalesVendorKey): FlagshipSalesComparison | null
```

- [ ] **Step 1: Add RED adapter/component checks.** Extend `check-production.mjs` with canonical-first order and missing-value assertions. Reuse its existing `weeklyAnalysisSource`, `sellThroughSource`, `flagshipSalesSource`, `aniChartSource`, `miWeeklySummarySource`, and `pipelineSource` reads; add `productionSource` from `../src/components/cumulative-production-chart.tsx`, then add:

```js
assert.deepEqual(vendors.map(({ key }) => key), ["apple", "samsung", "xiaomi", "huawei", "honor", "oppo", "vivo", "transsion", "lenovo", "google", "others"])
assert.deepEqual(weeklyVendors.map(({ key }) => key), ["apple", "samsung", "xiaomi", "huawei", "honor", "oppo", "vivo", "transsion", "lenovo", "google", "others"])
assert.deepEqual(sellThroughVendors.map(({ key }) => key), ["apple", "samsung", "xiaomi", "huawei", "honor", "oppo", "vivo", "transsion", "lenovo", "google", "others"])
assert.deepEqual(flagshipSalesVendors.map(({ key }) => key), ["apple", "samsung", "xiaomi", "huawei", "honor", "oppo", "vivo", "transsion", "lenovo", "google"])
assert.equal(normalizeProviderValue(0, (raw) => typeof raw === "number" ? raw : null).value, 0)
const unavailable = Object.fromEntries([...canonicalVendors, { key: "others" }].map(({ key }) => [key, { status: "unavailable", value: null }]))
const zero = Object.fromEntries([...canonicalVendors, { key: "others" }].map(({ key }) => [key, { status: "available", value: 0 }]))
assert.equal(getSellThroughVendorTotals({ month: "2026-08", sellIn: unavailable, sellThrough: unavailable }).sellIn, null)
assert.equal(getSellThroughVendorTotals({ month: "2026-08", sellIn: zero, sellThrough: zero }).sellIn, 0)
assert.equal(getFlagshipSalesGenerationComparison("transsion"), null)
for (const source of [productionSource, weeklyAnalysisSource, sellThroughSource, flagshipSalesSource]) {
  assert.match(source, /—/)
  assert.match(source, /데이터 없음/)
}
assert.match(weeklyAnalysisSource, /weeklyVendors\.map/)
assert.match(sellThroughSource, /sellThroughVendors\.map/)
assert.match(flagshipSalesSource, /disabled|isDisabled/)
assert.doesNotMatch(aniChartSource, /vendor-catalog|canonicalVendors/)
assert.doesNotMatch(pipelineSource, /canonicalVendors/)
assert.doesNotMatch(miWeeklySummarySource, /vendor-catalog|canonicalVendors/)
```

- [ ] **Step 2: Run RED, then adapt the four data modules.** Run `npm.cmd test` and confirm the new order/source assertions fail. Update `package.json` `data:update` and `data:check` to invoke `node --experimental-strip-types scripts/update-dashboard-data.mjs`. In `update-dashboard-data.mjs`, normalize aliases into canonical keys, accept absent columns as unavailable, preserve zero, and retain nonfatal `dataErrors` for malformed/unmapped/conflicting fields. In `production.ts`, `weekly.ts`, and `sell-through.ts`, expose canonical values and `others` separately, preserve existing fixtures and twelve months, and make totals/trends/ratios skip unavailable values while returning `null` when no input is available. In `flagship-sales.ts`, retain the seven existing model groups and 53 models, change `HONOR` to `Honor`, insert empty unavailable Huawei/Transsion/Lenovo groups at their canonical positions, and return `null` for unavailable totals/comparisons.

- [ ] **Step 3: Apply the smallest component changes and run GREEN.** Iterate catalog entries rather than provider rows in the four named components. At the rendering boundary use `value.status === "available" ? value.value : null`, render `—` with an sr-only `데이터 없음`, disable unavailable controls, pass null chart points, and exclude unavailable values from totals/denominators/domains. Keep existing focus, tooltip, model labels, model colors, shell, and accessibility semantics. Run:

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
git diff --check
```

The build must regenerate the listed tracked exports; existing ANI, pipeline, and report-only checker assertions must still pass.

- [ ] **Step 4: Stage only the implementation outputs and commit.** From the repository root, stage the exact modified source/checker files plus generated files, then verify and commit:

```powershell
git add prototype/mi-dashboard-shadcn/package.json prototype/mi-dashboard-shadcn/scripts/update-dashboard-data.mjs prototype/mi-dashboard-shadcn/src/data/production.ts prototype/mi-dashboard-shadcn/src/data/weekly.ts prototype/mi-dashboard-shadcn/src/data/sell-through.ts prototype/mi-dashboard-shadcn/src/data/flagship-sales.ts prototype/mi-dashboard-shadcn/src/components/cumulative-production-chart.tsx prototype/mi-dashboard-shadcn/src/components/weekly-analysis.tsx prototype/mi-dashboard-shadcn/src/components/sell-through-analysis.tsx prototype/mi-dashboard-shadcn/src/components/flagship-sales-chart.tsx prototype/mi-dashboard-shadcn/scripts/check-production.mjs
git add site/index.html site/MI_SigmaIntel.html site/MI_Weekly_2026W32.html site/MI_SellThrough.html site/MI_Counterpoint_Flagship_Sales.html site/MI_ANI.html site/MI_Insight_Weekly_Report.html site/MI_Insight_Weekly_SellThrough.html site/MI_TAM_Pipeline_Check.html
git add -u -- site/assets
git add -- site/assets/index-*.js site/assets/index-*.css
git diff --cached --check
git commit -m "feat: standardize vendor rendering"
git status --short --branch
```

## Plan Self-Review

- Spec coverage: catalog order/labels/colors, aliases, explicit zero, unavailable rendering/calculation rules, additions, data errors, four datasets, four components, generated exports, and all three non-goal page classes are assigned above.
- Deferred-work scan: every step has an exact command or implementation rule; no deferred work or unnamed file remains.
- Type consistency: `CanonicalVendorKey` feeds all four dataset key unions; `VendorValue<T>` reaches production, Weekly, Sell Through, and the Recharts/table boundary; Flagship unavailable APIs return `null`.
- Final gate: `npm.cmd test`, typecheck, lint, build, and `git diff --check` must pass; `.superpowers/` remains untracked and unstaged; do not push.
