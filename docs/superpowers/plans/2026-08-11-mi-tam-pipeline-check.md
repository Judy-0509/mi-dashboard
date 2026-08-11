# MI TAM Pipeline Check Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a static MI TAM → Pipeline Check page that compares six quarters of Production, two independent inventory snapshots, Sell-in, and Sell-out in one horizontal pipeline with shared chart scaling and standalone HTML export.

**Architecture:** Keep the existing hash-routed React portal, page configuration, and generic exporter as the source of truth. One typed data module owns the deterministic fixture, shared Y-axis, chart projections, and derived Executive Summary; one page component reuses existing Card, ChartContainer, Recharts, and compact-table styles; existing App/sidebar/config/check scripts only wire and validate the new page.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Tailwind CSS 4, existing shadcn/ui Card and chart primitives, Recharts 3, Node assertion scripts.

## Global Constraints

- Route key and hash are exactly `pipeline-check` and `#pipeline-check`; export filename is exactly `MI_TAM_Pipeline_Check.html`.
- Header copy is exactly `MI TAM / PIPELINE CHECK`, `분기별 Pipeline Check`, and `2025 Q1–2026 Q2 Production · Inventory · Sell-in · Sell-out`.
- The fixed dimensions are exactly six quarters (`2025 Q1` through `2026 Q2`), three Vendors (`Apple`, `Samsung`, `CN OEM`), and unit `Mu`.
- The single Card order is exactly `Production → Production Inventory → Sell-in → Channel Inventory → Sell-out`; all five blocks stay in one desktop row without horizontal scrolling.
- Production, Sell-in, and Sell-out use the same height, plot margins, shared fixed Y-axis domain, and identical ticks; segment values show one decimal and bar totals show one decimal plus `Mu`.
- Inventory tables are independent quarter-end snapshots, not chart differences; each has three Vendor rows and six quarter columns, formats values as one decimal plus `Mu`, and renders `null` as `N/A`.
- Executive Summary has exactly three derived bullets using concise `~임`, `~함`, `~필요` report language.
- Reuse existing `PageActions`, `Card`, `ChartContainer`, Recharts, button/link behavior, typography, color tokens, and generic exporter. Add no dependency, router, schema library, filter, toggle, click linkage, mobile layout, data generator, Excel/DB/API integration, or visible mock-data label.
- The original Excel URL remains `null`; the existing disabled-link behavior is preserved. Standalone export has no sidebar or page actions.
- Do not alter existing page routes, exports, page behavior, or unrelated formatting. Do not push.

---

## File Structure

- Create: `prototype/mi-dashboard-shadcn/src/data/pipeline-check.ts` — typed fixed dimensions, six-quarter fixture, chart projections, shared axis, and derived summary.
- Create: `prototype/mi-dashboard-shadcn/src/components/pipeline-check.tsx` — Executive Summary and the single-row five-block Pipeline Card.
- Modify: `prototype/mi-dashboard-shadcn/src/App.tsx`, `src/components/portal-sidebar.tsx`, `src/data/page-config.json` — route, page header/actions, sidebar group, and export metadata.
- Modify: `prototype/mi-dashboard-shadcn/scripts/check-production.mjs`, `scripts/check-weekly-html.mjs` — data/UI contract and generic export assertions.
- Regenerate: `site/index.html`, all existing `site/MI_*.html`, new `site/MI_TAM_Pipeline_Check.html`, and the changed `site/assets/index-*.js`/`index-*.css` bundle files.

### Task 1: Add typed pipeline data, derived chart projections, shared axis, and summary

**Files:**
- Create: `prototype/mi-dashboard-shadcn/src/data/pipeline-check.ts`
- Modify: `prototype/mi-dashboard-shadcn/scripts/check-production.mjs`

**Interfaces:**

```ts
export const pipelineQuarters: readonly ["2025 Q1", "2025 Q2", "2025 Q3", "2025 Q4", "2026 Q1", "2026 Q2"]
export type PipelineVendorKey = "apple" | "samsung" | "cnOem"
export const pipelineVendors: readonly { key: PipelineVendorKey; label: "Apple" | "Samsung" | "CN OEM"; color: string }[]
export type PipelineFlowMetric = "production" | "sellIn" | "sellOut"
export type PipelineInventoryMetric = "productionInventory" | "channelInventory"
export type PipelineValues = Record<PipelineVendorKey, number>
export type PipelineInventoryValues = Record<PipelineVendorKey, number | null>
export type PipelineQuarter = {
  quarter: (typeof pipelineQuarters)[number]
  production: PipelineValues; productionInventory: PipelineInventoryValues
  sellIn: PipelineValues; channelInventory: PipelineInventoryValues; sellOut: PipelineValues
}
export type PipelineChartPoint = PipelineValues & { quarter: PipelineQuarter["quarter"]; total: number }
export const pipelineData: readonly PipelineQuarter[]
export const pipelineYAxisDomain: readonly [0, number]
export const pipelineYAxisTicks: readonly number[]
export const pipelineExecutiveSummary: readonly [string, string, string]
export function getPipelineChartData(metric: PipelineFlowMetric): PipelineChartPoint[]
```

- [ ] **Step 1: Write the failing data-contract check.** Add imports from `../src/data/pipeline-check.ts` to `check-production.mjs`, then add these assertions after the existing data checks:

```js
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
```

- [ ] **Step 2: Run the red check.**

```powershell
Set-Location prototype\mi-dashboard-shadcn
npm.cmd test
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/data/pipeline-check.ts`.

- [ ] **Step 3: Implement the minimal typed module.** Declare the fixture explicitly, without a generator, using these exact values:

```ts
export const pipelineData = [
  { quarter: "2025 Q1", production: { apple: 58, samsung: 72, cnOem: 130 }, productionInventory: { apple: 14, samsung: 18, cnOem: 25 }, sellIn: { apple: 55, samsung: 70, cnOem: 125 }, channelInventory: { apple: 16, samsung: 20, cnOem: 31 }, sellOut: { apple: 52, samsung: 68, cnOem: 121 } },
  { quarter: "2025 Q2", production: { apple: 62, samsung: 74, cnOem: 135 }, productionInventory: { apple: 15, samsung: 19, cnOem: 28 }, sellIn: { apple: 59, samsung: 72, cnOem: 130 }, channelInventory: { apple: 17, samsung: 21, cnOem: 34 }, sellOut: { apple: 57, samsung: 71, cnOem: 128 } },
  { quarter: "2025 Q3", production: { apple: 88, samsung: 77, cnOem: 139 }, productionInventory: { apple: 20, samsung: 18, cnOem: 31 }, sellIn: { apple: 80, samsung: 75, cnOem: 136 }, channelInventory: { apple: 24, samsung: 20, cnOem: 36 }, sellOut: { apple: 74, samsung: 76, cnOem: 132 } },
  { quarter: "2025 Q4", production: { apple: 76, samsung: 80, cnOem: 142 }, productionInventory: { apple: 18, samsung: 20, cnOem: 34 }, sellIn: { apple: 79, samsung: 78, cnOem: 138 }, channelInventory: { apple: 19, samsung: 22, cnOem: 37 }, sellOut: { apple: 82, samsung: 77, cnOem: 135 } },
  { quarter: "2026 Q1", production: { apple: 66, samsung: 83, cnOem: 146 }, productionInventory: { apple: 16, samsung: 21, cnOem: 36 }, sellIn: { apple: 64, samsung: 81, cnOem: 142 }, channelInventory: { apple: 18, samsung: 24, cnOem: 41 }, sellOut: { apple: 63, samsung: 79, cnOem: 139 } },
  { quarter: "2026 Q2", production: { apple: 72, samsung: 86, cnOem: 151 }, productionInventory: { apple: 18, samsung: 22, cnOem: 40 }, sellIn: { apple: 69, samsung: 84, cnOem: 145 }, channelInventory: { apple: 20, samsung: 25, cnOem: 45 }, sellOut: { apple: 68, samsung: 82, cnOem: 141 } },
] as const satisfies readonly PipelineQuarter[]
```

Implement `getPipelineChartData(metric)` as a six-row projection with a one-decimal `total`. Derive `pipelineYAxisDomain` once from the maximum total across all three flow metrics, rounded up to the next `50`; derive `pipelineYAxisTicks` in `50`-Mu steps. Derive the exact three summary strings from the latest and previous rows so the fixture and visible copy cannot drift:

```ts
export const pipelineExecutiveSummary = [
  "2026 Q2 Production 309.0Mu → Sell-in 298.0Mu → Sell-out 291.0Mu로 단계별 격차 11.0Mu·7.0Mu임",
  "Production Inventory 80.0Mu, Channel Inventory 90.0Mu로 전분기 대비 각각 +7.0Mu 증가함",
  "CN OEM Channel Inventory가 45.0Mu로 가장 높아 재고 축적 여부 확인 필요",
] as const
```

The implementation must calculate the inserted numbers and interpolate them; the literal block above is the required output, not a second hard-coded copy.

- [ ] **Step 4: Run the green check and commit.**

```powershell
npm.cmd test
git add src/data/pipeline-check.ts scripts/check-production.mjs
git commit -m "feat: add MI TAM pipeline data"
```

Expected: exit `0`; only the data module and its assertions are committed.

### Task 2: Build the one-row five-block Pipeline Check UI

**Files:**
- Create: `prototype/mi-dashboard-shadcn/src/components/pipeline-check.tsx`
- Modify: `prototype/mi-dashboard-shadcn/scripts/check-production.mjs`

**Interfaces:**

```ts
export function PipelineCheck(): React.ReactElement
type PipelineStackedChartProps = { metric: PipelineFlowMetric; title: "Production" | "Sell-in" | "Sell-out" }
type PipelineInventoryTableProps = { metric: PipelineInventoryMetric; title: "Production Inventory" | "Channel Inventory" }
```

- [ ] **Step 1: Add the failing UI source assertions.** Read `src/components/pipeline-check.tsx` in `check-production.mjs` and assert all reusable primitives, labels, accessibility hooks, common-axis usages, and the exact layout order:

```js
const pipelineSource = readFileSync(
  new URL("../src/components/pipeline-check.tsx", import.meta.url),
  "utf8",
)
assert.match(pipelineSource, /pipelineExecutiveSummary\.map/)
assert.match(pipelineSource, /grid-cols-\[minmax\(0,1fr\)_210px_minmax\(0,1fr\)_210px_minmax\(0,1fr\)\]/)
assert.equal(pipelineSource.match(/domain=\{pipelineYAxisDomain\}/g)?.length, 1)
assert.equal(pipelineSource.match(/ticks=\{pipelineYAxisTicks\}/g)?.length, 1)
assert.match(pipelineSource, /pipelineVendors\.map/)
assert.match(pipelineSource, /accessibilityLayer/)
assert.match(pipelineSource, /<caption/)
assert.match(pipelineSource, /scope="col"/)
assert.match(pipelineSource, /scope="row"/)
assert.match(pipelineSource, /value === null \? "N\/A" : `\$\{value\.toFixed\(1\)\}Mu`/)
const pipelineOrder = [
  'title="Production"',
  'title="Production Inventory"',
  'title="Sell-in"',
  'title="Channel Inventory"',
  'title="Sell-out"',
]
assert.deepEqual(
  pipelineOrder.map((marker) => pipelineSource.indexOf(marker)),
  [...pipelineOrder.map((marker) => pipelineSource.indexOf(marker))].sort((a, b) => a - b),
)
assert.ok(pipelineOrder.every((marker) => pipelineSource.indexOf(marker) >= 0))
```

The domain/tick assertions are intentionally one each because all three chart instances render through the same `PipelineStackedChart` implementation.

- [ ] **Step 2: Run the red check.**

```powershell
npm.cmd test
```

Expected: FAIL with `ENOENT` for `src/components/pipeline-check.tsx`.

- [ ] **Step 3: Implement one component with two private render helpers.** Use one Executive Summary Card followed by one no-shadow Pipeline Card. Render a single shared Vendor legend and this exact grid skeleton inside the Pipeline Card:

```tsx
<div className="grid min-w-0 grid-cols-[minmax(0,1fr)_210px_minmax(0,1fr)_210px_minmax(0,1fr)] items-stretch gap-2">
  <PipelineStackedChart metric="production" title="Production" />
  <PipelineInventoryTable metric="productionInventory" title="Production Inventory" />
  <PipelineStackedChart metric="sellIn" title="Sell-in" />
  <PipelineInventoryTable metric="channelInventory" title="Channel Inventory" />
  <PipelineStackedChart metric="sellOut" title="Sell-out" />
</div>
```

`PipelineStackedChart` must call `getPipelineChartData(metric)` and use `ChartContainer className="h-[300px] w-full min-w-0"`. Use one stacked `<Bar>` per `pipelineVendors` entry, `stackId="pipeline"`, `barCategoryGap="10%"`, `isAnimationActive={false}`, `CartesianGrid vertical={false}`, six unskipped X-axis ticks at `fontSize={8}`, and the shared Y axis exactly once in the helper:

```tsx
<YAxis
  axisLine={false}
  domain={pipelineYAxisDomain}
  tickFormatter={(value) => `${value}m`}
  ticks={pipelineYAxisTicks}
  tickLine={false}
  tickMargin={4}
  width={30}
/>
```

Give all charts the same `margin={{ top: 24, right: 2, left: 0, bottom: 4 }}`. Each Bar has a centered `LabelList` with `Number(value).toFixed(1)`; only the final `cnOem` Bar has a top `LabelList` using `dataKey="total"` and `${Number(value).toFixed(1)}Mu`. Keep `ChartTooltipContent`; do not attach click or hover handlers.

`PipelineInventoryTable` must render a semantic `<table className="h-[300px] w-full table-fixed border-collapse text-[8px] tabular-nums">` with visible title, visually hidden caption `${title} · 단위 Mu`, six `scope="col"` quarter headers, three `scope="row"` Vendor labels, and `value === null ? "N/A" : `${value.toFixed(1)}Mu``. Use neutral borders/background only; do not add heatmap coloring.

Render the summary with the existing `ExecutiveSummary` Card grammar (`my-4`, uppercase title, square primary bullets, `text-sm leading-5 text-muted-foreground`). Give each chart/table an `aria-labelledby` target and keep the legend as color swatch plus visible Vendor text.

- [ ] **Step 4: Run component checks and commit.**

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run lint
git add src/components/pipeline-check.tsx scripts/check-production.mjs
git commit -m "feat: add MI TAM pipeline view"
```

Expected: all commands exit `0`; the component shows exactly three charts and two tables from the Task 1 interfaces.

### Task 3: Wire route, navigation, actions, generic export, and generated site

**Files:**
- Modify: `prototype/mi-dashboard-shadcn/src/App.tsx`
- Modify: `prototype/mi-dashboard-shadcn/src/components/portal-sidebar.tsx`
- Modify: `prototype/mi-dashboard-shadcn/src/data/page-config.json`
- Modify: `prototype/mi-dashboard-shadcn/scripts/check-production.mjs`
- Modify: `prototype/mi-dashboard-shadcn/scripts/check-weekly-html.mjs`
- Regenerate: `site/index.html`, `site/MI_ANI.html`, `site/MI_Counterpoint_Flagship_Sales.html`, `site/MI_Insight_Weekly_Report.html`, `site/MI_Insight_Weekly_SellThrough.html`, `site/MI_SellThrough.html`, `site/MI_SigmaIntel.html`, `site/MI_Weekly_2026W32.html`, `site/MI_TAM_Pipeline_Check.html`, and `site/assets/index-*.js`/`index-*.css`

**Interfaces:**

```ts
// portal-sidebar.tsx union addition
| "pipeline-check"

// page-config.json addition
"pipeline-check": {
  "hash": "#pipeline-check",
  "exportFileName": "MI_TAM_Pipeline_Check.html",
  "originalExcelUrl": null
}

// App.tsx
function PipelineCheckPage(): React.ReactElement
```

The existing `PAGE_CONFIG`, `pageFromHash()`, `navigate()`, `PageActions`, `buildAllPageHtml()`, and `pageExportTargets` APIs remain unchanged.

- [ ] **Step 1: Add failing route/export assertions.** In `check-production.mjs`, assert the sidebar contains `label: "MI TAM"`, `child: "Pipeline Check"`, page/hash strings, and App contains the exact header copy, `<PageActions page="pipeline-check" />`, `<PipelineCheck />`, and `activePage === "pipeline-check"`. Assert `page-config.json` has the exact object above. In `check-weekly-html.mjs`, add:

```js
const pipelineTarget = pageExportTargets.find(
  ({ page }) => page === "pipeline-check",
)
assert.deepEqual(pipelineTarget, {
  page: "pipeline-check",
  hash: "#pipeline-check",
  outputName: "MI_TAM_Pipeline_Check.html",
})
const pipelineHtml = readFileSync(
  path.join(siteDir, pipelineTarget.outputName),
  "utf8",
)
assert.match(pipelineHtml, /window\.__MI_EXPORT_PAGE__ = "pipeline-check"/)
assert.match(pipelineHtml, /window\.location\.hash = "#pipeline-check"/)
assert.doesNotMatch(pipelineHtml, /<aside\b/i)
assert.doesNotMatch(pipelineHtml, /PageActions/)
assert.doesNotMatch(pipelineHtml, /<script[^>]+\bsrc=/i)
assert.doesNotMatch(pipelineHtml, /<link[^>]+rel=["']stylesheet["']/i)
```

- [ ] **Step 2: Run the red route/export check.**

```powershell
npm.cmd test
```

Expected: FAIL because `pipeline-check` is not yet a configured page/export target.

- [ ] **Step 3: Add the smallest existing-pattern wiring.** Extend `PortalPage`; add a top-level `MI TAM` provider section with one `Pipeline Check` child; add the exact JSON entry; import `PipelineCheck`; and add `PipelineCheckPage` with the approved header and `<PageActions page="pipeline-check" />`. Add the `activePage === "pipeline-check" ? <PipelineCheckPage /> :` branch before the Sigma fallback. Keep `pipeline-check` out of the shell's `scrollable` expression so the approved one-page desktop layout does not gain a vertical scrollbar. Do not change routing or exporter functions.

- [ ] **Step 4: Run the consolidated final verification and inspect generated output.**

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
Test-Path ..\..\site\MI_TAM_Pipeline_Check.html
git diff --check
git status --short
```

Expected: every command exits `0`; `Test-Path` prints `True`; the new export bootstraps `pipeline-check`; all standalone files contain inline assets; no export contains a sidebar; Git reports only planned source/check/generated-site changes plus any explicitly noted pre-existing state.

- [ ] **Step 5: Browser-check the live route and standalone export.** At a 1440 × 900 desktop viewport, open `http://127.0.0.1:8000/#pipeline-check` and confirm the exact header, three summary bullets, shared Vendor legend, five blocks in the approved order on one line, six quarters, one-decimal segment/total values, identical chart baselines/max ticks, both 3 × 6 inventory tables, disabled Excel action, Download action, and no horizontal or vertical page scrollbar. Open `site/MI_TAM_Pipeline_Check.html` directly and confirm the same static content without sidebar/actions. Also refresh the hash route once and use browser back/forward once to confirm existing navigation behavior.

- [ ] **Step 6: Stage the exact deliverable and commit without pushing.**

```powershell
git add src/App.tsx src/components/portal-sidebar.tsx src/data/page-config.json scripts/check-production.mjs scripts/check-weekly-html.mjs
git add ..\..\site\index.html ..\..\site\MI_ANI.html ..\..\site\MI_Counterpoint_Flagship_Sales.html ..\..\site\MI_Insight_Weekly_Report.html ..\..\site\MI_Insight_Weekly_SellThrough.html ..\..\site\MI_SellThrough.html ..\..\site\MI_SigmaIntel.html ..\..\site\MI_Weekly_2026W32.html ..\..\site\MI_TAM_Pipeline_Check.html
git add -A -- ..\..\site\assets
git diff --cached --check
git commit -m "feat: add MI TAM pipeline route and export"
git status --short --branch
```

Expected: the commit contains only the planned wiring, checks, and generated site; the branch is clean apart from the pre-existing untracked `.superpowers/` directory; no push occurs.

## Plan Self-Review

- Spec coverage: Task 1 covers the exact dimensions, independent inventory data, shared Y-axis/ticks, deterministic values, and derived summary; Task 2 covers the Executive Summary, accessible chart/table grammar, one-row five-block order, values/totals, and no interactions; Task 3 covers MI TAM navigation, hash route, shared actions, standalone export, generated assets, regression commands, and desktop/browser checks.
- Type consistency: `PipelineFlowMetric`, `PipelineInventoryMetric`, `PipelineVendorKey`, `PipelineQuarter`, `PipelineChartPoint`, `getPipelineChartData`, shared-axis exports, and `pipeline-check` use the same names in every task and consumer.
- Scope check: no extra dependency, router, shared abstraction, filter, mobile branch, event linkage, external data integration, or unrelated cleanup is planned.
- Marker scan: every created/modified file, exported interface, fixture value, command, expected failure, expected success, route, copy string, export target, and commit boundary is explicit.
