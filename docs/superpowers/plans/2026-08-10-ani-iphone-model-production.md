# ANI iPhone Model Production Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an ANI iPhone Model Production page with deterministic model-level quarterly production, six-month forecast history, independent generation/type filters, and SigmaIntel-compatible visual grammar.

**Architecture:** Keep ANI data and chart behavior in new ANI-local modules. Extend the existing sidebar/hash page switch with ani, while leaving SigmaIntel and Counterpoint Weekly components and data paths unchanged. Reuse the installed React, Recharts, shadcn, and chart primitives; add no dependency and extract no shared abstraction.

**Tech Stack:** React 19, TypeScript, Recharts, React Aria Components, existing shadcn Card/Button/chart primitives, Node assert source/data checks, Vite.

## Global Constraints

- Work inside prototype/mi-dashboard-shadcn for application code and its existing scripts/check-production.mjs check.
- Add no dependency, no network retrieval, and no shared Sigma/ANI or Sigma/Weekly refactor.
- Preserve current SigmaIntel vendor behavior and Counterpoint Weekly behavior.
- Use the exact ANI copy ANI, iPhone Model Production, ANI / iPhone Model Production, iPhone 모델 생산 전망, and 2024 Q1–2027 Q2 분기별 Forecast · 단위: Mu.
- Use #ani and the ani page key; default ANI selection is the latest quarter 2027 Q2.
- Keep all UI labels and filter groups keyboard accessible with visible selected/focus states.
- Do not commit changes during execution; finish with tests, build, and a local visual handoff.

---

### Task 1: Add the ANI data contract and deterministic synthetic dataset

**Files:**
- Create: prototype/mi-dashboard-shadcn/src/data/ani.ts
- Modify: prototype/mi-dashboard-shadcn/scripts/check-production.mjs
- Do not modify: prototype/mi-dashboard-shadcn/src/data/production.ts, src/data/weekly.ts, or src/data/dashboard.json

**Interfaces:**

Implement these exported types, constants, and functions in src/data/ani.ts:

    export type AniGenerationKey = "iphone15" | "iphone16" | "iphone17" | "iphone18"
    export type AniModelTypeKey =
      | "basic"
      | "plusAir"
      | "pro"
      | "proMax"
      | "e"
      | "foldable"
    export type AniModelKey =
      | "iphone15Basic" | "iphone15Plus" | "iphone15Pro" | "iphone15ProMax"
      | "iphone16Basic" | "iphone16Plus" | "iphone16Pro" | "iphone16ProMax" | "iphone16E"
      | "iphone17Basic" | "iphone17Air" | "iphone17Pro" | "iphone17ProMax" | "iphone17E"
      | "iphone18Basic" | "iphone18Air" | "iphone18Pro" | "iphone18ProMax" | "iphone18E" | "iphone18Foldable"

    export interface AniModel {
      key: AniModelKey
      generation: AniGenerationKey
      type: AniModelTypeKey
      label: string
      color: string
    }

    export type AniModelValues = Record<AniModelKey, number>
    export type AniQuarterlyProduction = AniModelValues & { quarter: string }
    export type AniForecastHistoryPoint = AniModelValues & {
      quarter: string
      period: string
    }
    export interface AniHistorySummary {
      currentTotal: number
      monthOverMonth: number
      sixMonth: number
    }

    export const aniModels: readonly AniModel[]
    export const aniQuarterlyProduction: readonly AniQuarterlyProduction[]
    export const aniFocusQuarter: "2027 Q2"
    export const aniProductionYAxisDomain: readonly [number, number]
    export function getAniVisibleModelKeys(
      generations: readonly AniGenerationKey[],
      types: readonly AniModelTypeKey[],
    ): AniModelKey[]
    export function getAniProductionTotal(
      item: AniModelValues,
      visibleModelKeys?: readonly AniModelKey[],
    ): number
    export function getAniForecastHistory(
      quarter: string,
    ): readonly AniForecastHistoryPoint[]
    export function getAniHistorySummary(
      history: readonly AniForecastHistoryPoint[],
      visibleModelKeys: readonly AniModelKey[],
    ): AniHistorySummary

- [ ] **Step 1: Add red data assertions before creating ani.ts.** Extend scripts/check-production.mjs with imports and assertions for the contract above: 14 quarterly rows from 2024 Q1 through 2027 Q2; exactly 20 model entries; iphone15 has four, iphone16 five, iphone17 five, and iphone18 six; getAniVisibleModelKeys(["iphone16"], ["e"]) returns only ["iphone16E"]; getAniVisibleModelKeys(["iphone17"], ["plusAir"]) returns only ["iphone17Air"]; getAniVisibleModelKeys(["iphone18"], ["foldable"]) returns only ["iphone18Foldable"]; and a combined generation/type selection returns the intersection. Assert that each quarter total equals the sum of all 20 model values, the default focus quarter is 2027 Q2, each forecast history has six points, and the last history point matches its quarter row for every model.

      assert.equal(aniQuarterlyProduction.length, 14)
      assert.equal(aniModels.length, 20)
      assert.deepEqual(getAniVisibleModelKeys(["iphone16"], ["e"]), ["iphone16E"])
      assert.deepEqual(getAniVisibleModelKeys(["iphone17"], ["plusAir"]), ["iphone17Air"])
      assert.deepEqual(getAniVisibleModelKeys(["iphone18"], ["foldable"]), ["iphone18Foldable"])
      assert.equal(aniFocusQuarter, "2027 Q2")
      assert.equal(getAniForecastHistory("2027 Q2").length, 6)

- [ ] **Step 2: Run the red check.**

  Run from prototype/mi-dashboard-shadcn:

      npm test

  Expected result: failure because ../src/data/ani.ts does not exist yet.

- [ ] **Step 3: Implement the smallest data module.** Add the 20 approved model metadata entries and 14 hand-authored deterministic quarterly rows. Use no random source. Map iPhone 15/16 Plus and iPhone 17/18 Air to plusAir; give each generation a base hue with light Basic/Plus-Air and dark Pro/Pro Max tones; assign e and Foldable dedicated distinct hue families. Use zero values for pre-introduction model segments where needed. Generate six deterministic monthly history points per quarter with the latest point equal to the quarter row, and calculate currentTotal, monthOverMonth, and sixMonth only from the requested visible model keys.

- [ ] **Step 4: Run the green data check.**

      npm test
      npm run typecheck

  Expected result: all existing production/Weekly assertions and the new ANI data assertions pass; no Sigma or Weekly source behavior changes.

### Task 2: Add the ANI chart, sidebar/hash route, and App integration

**Files:**
- Create: prototype/mi-dashboard-shadcn/src/components/ani-production-chart.tsx
- Modify: prototype/mi-dashboard-shadcn/src/components/portal-sidebar.tsx
- Modify: prototype/mi-dashboard-shadcn/src/App.tsx
- Modify: prototype/mi-dashboard-shadcn/scripts/check-production.mjs
- Do not modify: prototype/mi-dashboard-shadcn/src/components/cumulative-production-chart.tsx, weekly-analysis.tsx, or any existing Sigma/Weekly data module

**Interfaces:**

    export function AniProductionChart(): React.JSX.Element

Extend PortalPage to "sigma" | "weekly" | "ani". Keep providers as the existing array shape and add { label: "ANI", child: "iPhone Model Production", page: "ani", href: "#ani" }. App.tsx must keep pageFromHash(): PortalPage, navigate(page: PortalPage): void, and the existing SigmaPage/WeeklyPage behavior; add a local AniPage(): React.JSX.Element that renders the exact ANI header and AniProductionChart.

- [ ] **Step 1: Add red source assertions before implementing the component or route.** Extend scripts/check-production.mjs to read App.tsx, portal-sidebar.tsx, and ani-production-chart.tsx. Assert the ANI provider/child/page/hash strings, #ani hash handling, AniPage rendering, the exact header copy, both Korean filter group labels, getAniVisibleModelKeys, getAniForecastHistory, 현재 Forecast, 전월 대비, and 6개월 대비. Assert the ANI component contains the Sigma 58:42 layout, clickable quarter handler, six-point history data, and no getVendorHistoryDeltas/vendor delta list. Assert existing Sigma and Weekly source checks remain unchanged.

- [ ] **Step 2: Run the red check.**

      npm test

  Expected result: failure because the ANI component, provider entry, hash branch, and page render do not exist yet.

- [ ] **Step 3: Implement the ANI page and chart without touching Sigma/Weekly behavior.**

  - In portal-sidebar.tsx, add the ani type and provider entry. Preserve existing active styling, accessible navigation, and provider ordering.
  - In App.tsx, map #ani to ani, map ani back to #ani, render AniPage for that state, and make ANI vertically scrollable while preserving the existing Sigma and Weekly scroll behavior. Keep isWeeklyExport behavior intact.
  - In ani-production-chart.tsx, keep generation and type selections as independent Set state initialized to all options, prevent removing the last option in either group, and expose 필터 초기화 with aria-pressed/focusable controls. Derive the visible model list with getAniVisibleModelKeys.
  - Render a SigmaIntel-style bordered no-shadow Card with a 58:42 shrinkable left/right grid. Render quarterly stacked Bar segments for visible models, segment values, total labels, existing tooltip/accessibility layer, and an onClick quarter selection that starts at 2027 Q2.
  - Render six monthly stacked history bars for the selected quarter using the same visible models and colors. Show only the three summary values from getAniHistorySummary; do not render a vendor legend or vendor delta list.
  - Hide inline segment labels only when the rendered segment is below the 24 px fit threshold; keep the value in the tooltip and accessible chart data. Keep wrappers min-w-0 so the page has no horizontal overflow.

- [ ] **Step 4: Run the complete verification.**

      npm test
      npm run build

  Expected result: all data/source assertions pass, the TypeScript/Vite build succeeds, and no SigmaIntel or Counterpoint Weekly behavior regresses.

- [ ] **Step 5: Hand off for visual review.**

  From prototype/mi-dashboard-shadcn, start the existing local server:

      npm run dev

  Open the printed local URL with #ani, confirm the sidebar route, default 2027 Q2, filter intersections, color families, quarter click/history update, summary-only deltas, and label hiding. Stop after reporting the local URL and any visual observations; do not commit.

### Task 3: Apply the approved ANI visual encoding addendum

**Files:**
- Modify: docs/superpowers/specs/2026-08-10-ani-iphone-model-production-design.md
- Modify: docs/superpowers/plans/2026-08-10-ani-iphone-model-production.md
- Modify: prototype/mi-dashboard-shadcn/scripts/check-production.mjs
- Modify: prototype/mi-dashboard-shadcn/src/data/ani.ts
- Modify: prototype/mi-dashboard-shadcn/src/components/ani-production-chart.tsx
- Do not modify: Sigma/Weekly components or data modules

- [ ] **Step 1: Update the spec and plan addendum.** Record the approved generation-color, special-type pattern, first-introduction annotation, selected-quarter custom tick/underline, shared special-model colors, and 12 px readable label threshold rules above.
- [ ] **Step 2: Add red assertions and run `npm test`.** Assert exact shared colors, chart-specific pattern hooks in both charts, accessible selected-quarter custom tick/2 px underline, absence of selected Cell stroke, generation-family legend/pattern samples, and the two conditional introduction markers. Capture the expected failure before production edits.
- [ ] **Step 3: Implement the visual encoding.** Keep filters, tooltip semantics, dynamic shared Y-domain, totals, history summaries, and existing Sigma/Weekly/export behavior unchanged. Use generation-colored SVG hatch/dot patterns with quarterly/history prefixes; replace selected bar outline with the custom accessible X-axis tick; and render only the two conditional quarterly introduction markers.
- [ ] **Step 4: Run the green checks.** Run `npm.cmd test`, `npm.cmd run build`, `npm.cmd run lint`, and `git diff --check`; append exact RED/GREEN output, changed files, and concerns to `task-2-report.md`. Do not perform broad browser QA, commit, or push.
