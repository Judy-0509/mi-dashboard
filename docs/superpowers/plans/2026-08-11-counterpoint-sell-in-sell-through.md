# Counterpoint Sell-in / Sell-through Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Counterpoint Sell-in / Sell-through page with a monthly SI/ST comparison chart and a compact Inventory/WoS vendor table, without changing SigmaIntel Production or Counterpoint Weekly behavior.

**Architecture:** Keep a deterministic monthly data contract in a new `sell-through.ts` module, separate from weekly sell-out data. Render the page-local combo chart and Inventory table in `sell-through-analysis.tsx`, then extend the existing hash/sidebar page switch with `#sell-through`; retain existing Card, chart, tooltip, and Sigma vendor color primitives rather than extracting or refactoring Sigma/Weekly components.

**Tech Stack:** React 19, TypeScript, Recharts, React Aria Components, existing shadcn Card/Button/chart primitives, Node assert source/data checks, Vite.

## Global Constraints

- Use the existing fixed desktop shell: `min-w-[1180px]`, `w-64` sidebar, and existing main padding/overflow behavior; no mobile scope.
- Use a `58fr / 42fr` content split with equal-height bordered, no-shadow panels.
- Use months `2025-09` through `2026-08`, Sigma vendor palette/order `Apple, Samsung, Xiaomi, OPPO, vivo, Transsion, Others`, and no region selector/data in Inventory.
- Calculate ratio exactly as `Sell-in / Sell-through * 100`; represent Sell-through zero as `null`/`N/A`, never as division by zero.
- Render the ratio line, points, and percent labels in the fixed yellow/amber color `#d97706`.
- Keep Inventory/WoS cell format, unit, and interpretation intentionally deferred; deterministic mock cells are layout-only fixtures.
- Keep new data separate from `src/data/weekly.ts`; do not modify or refactor Sigma/Weekly components or data modules.
- Add no dependencies, backend, external API, export behavior, or Executive Summary; generated `site/**` changes are allowed only during the final build step.
- Do not perform mobile redesign or broad browser QA.
- Each task follows RED → minimal implementation → GREEN → commit command; the worker may execute commits when following this plan.

---

### Task 1: Add the monthly Sell-in/Sell-through and Inventory data contract

**Files:**
- Create: `prototype/mi-dashboard-shadcn/src/data/sell-through.ts`
- Modify: `prototype/mi-dashboard-shadcn/scripts/check-production.mjs`
- Do not modify: `prototype/mi-dashboard-shadcn/src/data/weekly.ts`, `prototype/mi-dashboard-shadcn/src/data/production.ts`, or existing Sigma/Weekly components

**Interfaces:**

Export these exact types, constants, and functions from `src/data/sell-through.ts`:

```ts
export type SellThroughMonth =
  | "2025-09" | "2025-10" | "2025-11" | "2025-12"
  | "2026-01" | "2026-02" | "2026-03" | "2026-04"
  | "2026-05" | "2026-06" | "2026-07" | "2026-08"

export type SellThroughVendorKey =
  | "apple" | "samsung" | "xiaomi" | "oppo"
  | "vivo" | "transsion" | "others"

export interface SellThroughVendorMonth {
  month: SellThroughMonth
  sellIn: Record<SellThroughVendorKey, number>
  sellThrough: Record<SellThroughVendorKey, number>
}

export interface InventorySnapshotRow {
  vendor: SellThroughVendorKey
  inventory: readonly [number, number, number]
  wos: readonly [number, number, number]
}

export interface SellThroughTotals {
  sellIn: number
  sellThrough: number
  ratio: number | null
}

export const sellThroughMonths: readonly SellThroughMonth[]
export const sellThroughVendors: readonly {
  key: SellThroughVendorKey
  label: string
  color: string
}[]
export const sellThroughMonthly: readonly SellThroughVendorMonth[]
export const inventorySnapshots: readonly InventorySnapshotRow[]
export function getSellThroughRatio(sellIn: number, sellThrough: number): number | null
export function getSellThroughTotals(point: SellThroughVendorMonth): SellThroughTotals
export function getSellThroughVendorTotals(
  point: SellThroughVendorMonth,
  vendorKeys?: readonly SellThroughVendorKey[],
): SellThroughTotals
```

The vendor metadata must preserve the existing Sigma keys, labels, CSS colors, and order. The 12 monthly rows must be deterministic; each row must provide every vendor key for both metrics. Inventory snapshots must contain exactly the seven vendors and three ordered columns for each metric. Their numeric values are layout-only mock fixtures; do not attach a fixed unit or semantic interpretation to them.

- [ ] **Step 1: Write the failing data/source assertions.** Add assertions before creating `sell-through.ts`:

```js
assert.deepEqual(sellThroughMonths, [
  "2025-09", "2025-10", "2025-11", "2025-12",
  "2026-01", "2026-02", "2026-03", "2026-04",
  "2026-05", "2026-06", "2026-07", "2026-08",
])
assert.equal(sellThroughMonthly.length, 12)
assert.deepEqual(sellThroughVendors.map(({ key }) => key), [
  "apple", "samsung", "xiaomi", "oppo", "vivo", "transsion", "others",
])
assert.equal(getSellThroughRatio(120, 100), 120)
assert.equal(getSellThroughRatio(120, 0), null)
assert.equal(inventorySnapshots.length, 7)
assert.ok(inventorySnapshots.every((row) => row.inventory.length === 3 && row.wos.length === 3))
```

- [ ] **Step 2: Run RED.**

Run from `prototype/mi-dashboard-shadcn`:

```text
npm.cmd test
```

Expected: FAIL while `../src/data/sell-through.ts` and its exports do not exist.

- [ ] **Step 3: Implement the minimal data module.** Add the exact interfaces above, the 12 deterministic rows, Sigma vendor mapping, seven Inventory/WoS rows, and pure ratio/total helpers. Round only at the display boundary or to one decimal in helpers; preserve `null` for zero Sell-through. Do not import or alter weekly sell-out helpers.

- [ ] **Step 4: Run GREEN.**

```text
npm.cmd test
npm.cmd run typecheck
```

Expected: all existing production/Weekly assertions and the new data assertions pass.

- [ ] **Step 5: Commit the task.**

```text
git add prototype/mi-dashboard-shadcn/src/data/sell-through.ts prototype/mi-dashboard-shadcn/scripts/check-production.mjs
git commit -m "feat: add sell-through data contract"
```

### Task 2: Build the page-local analysis UI and route it from Counterpoint

**Files:**
- Create: `prototype/mi-dashboard-shadcn/src/components/sell-through-analysis.tsx`
- Modify: `prototype/mi-dashboard-shadcn/src/App.tsx`
- Modify: `prototype/mi-dashboard-shadcn/src/components/portal-sidebar.tsx`
- Modify: `prototype/mi-dashboard-shadcn/scripts/check-production.mjs`
- Consume: `prototype/mi-dashboard-shadcn/src/data/sell-through.ts`
- Do not modify: `prototype/mi-dashboard-shadcn/src/components/cumulative-production-chart.tsx`, `weekly-analysis.tsx`, or any Sigma/Weekly data module

**Interfaces:**

```tsx
export function SellThroughAnalysis(): React.JSX.Element
```

Extend `PortalPage` to include `"sell-through"`. The sidebar must represent Counterpoint with two children: `Weekly` → `#weekly` and `Sell-in / Sell-through` → `#sell-through`. `App.tsx` must map the new hash, render a local page header plus `SellThroughAnalysis`, preserve existing Sigma/Weekly/ANI branches, and make the new page scrollable using the existing shell policy.

- [ ] **Step 1: Write failing route/component source assertions.** Add checks before creating the component or route:

```js
const appSource = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8")
const sidebarSource = readFileSync(new URL("../src/components/portal-sidebar.tsx", import.meta.url), "utf8")
const sellThroughSource = readFileSync(new URL("../src/components/sell-through-analysis.tsx", import.meta.url), "utf8")
assert.match(sidebarSource, /Sell-in \/ Sell-through/)
assert.match(sidebarSource, /#sell-through/)
assert.match(appSource, /#sell-through/)
assert.match(appSource, /SellThroughAnalysis/)
assert.match(appSource, /Counterpoint \/ Sell-in · Sell-through/)
assert.match(appSource, /스마트폰 Sell-in \/ Sell-through/)
assert.match(sellThroughSource, /58fr.*42fr/)
assert.match(sellThroughSource, /Vendor.*Total/)
assert.match(sellThroughSource, /Inventory/)
assert.match(sellThroughSource, /25년 말.*26년 4월.*26년 8월/)
```

- [ ] **Step 2: Run RED.**

```text
npm.cmd test
```

Expected: FAIL because the new component, page route, and Counterpoint child link are absent.

- [ ] **Step 3: Implement the minimal route and page UI.**

  - In `portal-sidebar.tsx`, preserve existing SigmaIntel/ANI entries and active/focus treatment while rendering both Counterpoint child links with distinct `page` values and hashes.
  - In `App.tsx`, add `pageFromHash()` and `navigate()` handling for `#sell-through`, add a local header with eyebrow `Counterpoint / Sell-in · Sell-through`, title `스마트폰 Sell-in / Sell-through`, and the approved 2025년 9월–2026년 8월 subtitle, then render `SellThroughAnalysis`.
  - In `sell-through-analysis.tsx`, render equal-height Cards in `grid-cols-[minmax(0,58fr)_minmax(0,42fr)]` with `min-w-0` children. Keep `view` state as `"vendor" | "total"`, defaulting to `"vendor"`, and expose a keyboard-accessible single-selection Vendor/Total control with selected state.
  - Build 12 monthly grouped categories, each with SI left and ST right half-width bars. Vendor mode stacks the seven Sigma vendors in the exact existing order/colors; Total mode renders only the two monthly totals. Add a yellow ratio line and points on the percent axis, percent labels, bar total labels, and tooltips containing SI, ST, ratio, and Vendor values where applicable.
  - Render the right `Inventory` panel with no region control, vendor rows only, and two grouped three-column tables (`25년 말`, `26년 4월`, `26년 8월`). Keep mock cell values visibly compact without assigning a unit or interpretation in the UI.
  - Use existing `Card`, `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `BarChart`, `Line`, and focus-visible control conventions. Add accessible chart labels, table caption/column headers/row headers, and no horizontal overflow. Do not add Executive Summary, export controls, backend calls, or mobile branches.

- [ ] **Step 4: Run GREEN.**

```text
npm.cmd test
npm.cmd run typecheck
```

Expected: source/data assertions pass and the TypeScript check succeeds without touching Sigma/Weekly source behavior.

- [ ] **Step 5: Commit the task.**

```text
git add prototype/mi-dashboard-shadcn/src/components/sell-through-analysis.tsx prototype/mi-dashboard-shadcn/src/App.tsx prototype/mi-dashboard-shadcn/src/components/portal-sidebar.tsx prototype/mi-dashboard-shadcn/scripts/check-production.mjs
git commit -m "feat: add counterpoint sell-through page"
```

### Task 3: Verify the approved interaction contract and generate the static site

**Files:**
- Modify: `prototype/mi-dashboard-shadcn/scripts/check-production.mjs`
- Verify: `prototype/mi-dashboard-shadcn/src/data/sell-through.ts`
- Verify: `prototype/mi-dashboard-shadcn/src/components/sell-through-analysis.tsx`
- Verify: `prototype/mi-dashboard-shadcn/src/App.tsx`
- Verify: `prototype/mi-dashboard-shadcn/src/components/portal-sidebar.tsx`
- Generated only by final build: `site/**`

**Interfaces:**

The final source assertions must validate the approved behavior without changing shared Sigma/Weekly components:

```js
assert.match(sellThroughSource, /Sell-in.*Sell-through/)
assert.match(sellThroughSource, /ratio/)
assert.match(sellThroughSource, /#d97706/)
assert.match(sellThroughSource, /aria-label=.*Inventory|caption.*Inventory/i)
assert.doesNotMatch(sellThroughSource, /region selector|지역 selector/i)
assert.doesNotMatch(appSource, /ExecutiveSummary.*sell-through|sell-through.*ExecutiveSummary/i)
assert.doesNotMatch(sellThroughSource, /getWeekly|weekly.ts|CumulativeProductionChart/i)
```

- [ ] **Step 1: Add the failing final-contract assertions.** Add assertions for the ratio line/point, 12-month chart data, equal-height 58/42 panels, accessible Inventory table, no region selector, no Executive Summary, no weekly/Sigma component reuse, and the exact `#sell-through` route. Put these assertions in `check-production.mjs` before any final source correction.

- [ ] **Step 2: Run RED.**

```text
npm.cmd test
```

Expected: FAIL if any final-contract source hook is missing; record the exact assertion failure before correcting the smallest source omission.

- [ ] **Step 3: Apply only the smallest source corrections.** Fix the specific failing hook or semantics in the new page/data module and checker. Do not alter Sigma/Weekly/ANI behavior, add dependencies, or add mobile/export/backend scope. Preserve intentional layout-only Inventory mock values and the deferred cell unit/interpretation.

- [ ] **Step 4: Run GREEN and final verification.**

```text
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
npm.cmd run lint
git diff --check
```

Expected: all source/data assertions, typecheck, build, lint, and whitespace checks pass. The build may update `site/**`; no other generated output is in scope.

- [ ] **Step 5: Commit the verified task.**

```text
git add prototype/mi-dashboard-shadcn/scripts/check-production.mjs site
git commit -m "test: verify sell-through page contract"
```

## Plan self-review

- **Spec coverage:** Routing/header/shell are covered in Task 2; 58/42 equal-height panels, SI/ST bars, Vendor/Total toggle, Sigma palette/order, ratio formula/zero handling, tooltips/totals, Inventory grouped columns, accessibility, and data separation are covered in Tasks 1–2; non-goals and final regression checks are covered in all tasks and Task 3.
- **Placeholder review:** The plan states that Inventory/WoS mock cells are deterministic layout-only fixtures and explicitly defers their value format, unit, and interpretation; this is intentional, not an unresolved requirement.
- **Type consistency:** `SellThroughVendorKey`, `SellThroughMonth`, `SellThroughVendorMonth`, `InventorySnapshotRow`, and `SellThroughTotals` are defined once in Task 1 and consumed unchanged by Tasks 2–3. `getSellThroughRatio`, `getSellThroughTotals`, and `getSellThroughVendorTotals` signatures match every later reference.
- **Scope review:** No task changes Sigma/Weekly components or data, adds dependencies, implements mobile/export/backend, or adds Executive Summary. `site/**` is touched only by the final build task.
