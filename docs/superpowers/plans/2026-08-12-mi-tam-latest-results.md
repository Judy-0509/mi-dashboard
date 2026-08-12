# MI TAM Latest Results Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the deterministic `#latest-results` MI TAM page with Quarter/Agency views, Forecast-only selection, accessible monthly line history, and standalone export.

**Architecture:** Keep the existing hash-routed React portal, `DashboardShell`, `PageActions`, `PortalSidebar`, Recharts, and generic HTML exporter. Isolate all sample dimensions/values and pure display/selection validation in `src/data/latest-results.ts`; page/table/chart components consume that module without mutating raw data.

**Tech Stack:** React 19, TypeScript, Recharts 3, existing shadcn/ui primitives, Node `assert/strict`, Vite 8, and the existing exporter/check scripts.

## Global Constraints

- Exact dimensions: 6 agencies, 4 quarters (`2026 Q1`–`2026 Q4`), and canonical 10-vendor order from `src/data/vendor-catalog.ts`.
- Actual wins over Forecast; explicit `0` is valid; missing renders `—`; only Forecast cells are keyboard-activatable buttons.
- Use one visible-dot Recharts `LineChart`; no bar chart, new dependency, router, API, DB, network fetch, KPI, or Executive Summary.
- Follow `DESIGN.md` typography/tokens and existing desktop shell; no horizontal scrolling; preserve existing routes/exports.
- Commands run from `prototype/mi-dashboard-shadcn`; do not stage or commit this plan or implementation.

## Task 1: Data fixture and pure helpers (TDD)

**Files:** Create `prototype/mi-dashboard-shadcn/src/data/latest-results.ts`; modify `prototype/mi-dashboard-shadcn/scripts/check-production.mjs`.

**Interfaces:** Export `Quarter`, `Agency`, `ForecastSnapshot`, `ResultCell`, `LatestResultsAgency`, `LatestResultsView`, `ForecastSelection`, `latestResultsQuarters`, `latestResultsAgencies`, `latestResultsVendors`, `getResultCellState(cell)`, `getFirstForecast(view, selectedQuarter, selectedAgency)`, `getForecastHistory(selection)`, `isValidSourceUrl(url)`, and `validateLatestResultsData(agencies)`.

- [ ] Add RED assertions for exact agency/vendor/quarter order, complete `cells`, Actual precedence over simultaneous Forecast, `0` preservation, `—` state, finite history validation, valid/invalid/null source URLs, and first Forecast selection.
- [ ] Run `node --experimental-strip-types scripts/check-production.mjs`; expect the missing module/import to fail.
- [ ] Implement one explicit fixture in `latest-results.ts`, reusing `canonicalVendors`; include at least one Actual+Forecast conflict, one Forecast with snapshots, one numeric zero, and null source URLs. Throw on non-finite snapshot values or incomplete dimensions.
- [ ] Run `npm.cmd test` and `npm.cmd run typecheck`; the new assertions must pass without changing existing checks.

## Task 2: Page, semantic table, and Forecast chart (TDD)

**Files:** Create `src/components/latest-results-page.tsx`, `src/components/latest-results-table.tsx`, `src/components/forecast-history-chart.tsx`; modify `scripts/check-production.mjs`.

**Interfaces:** `LatestResultsPage(): React.ReactElement`; `LatestResultsTableProps { view: LatestResultsView; quarter: Quarter; agency: Agency; onForecastSelect(selection: ForecastSelection): void }`; `ForecastHistoryChartProps { selection: ForecastSelection | null }`.

- [ ] Add RED source assertions for `<table>`, `<th scope="row|col">`, real `button aria-pressed`, descriptive Forecast `aria-label`, no Forecast button for Actual/`—`, source links with `target="_blank" rel="noopener noreferrer"`, `LineChart`, `Line dot`, monthly labels, and empty-state text.
- [ ] Run `npm.cmd test`; expect missing component files/assertions to fail.
- [ ] Implement page state defaults (`2026 Q1`, `omdia`), Quarter columns (6 agencies), Agency columns (4 quarters), fixed 10-vendor rows, and reset to the first valid Forecast after view/selection changes. Render the exact title/subtitle, two-column table/chart shell, and existing actions.
- [ ] Render Actual as number only, Forecast as `${value} (F)`, missing as `—`; use `getResultCellState`, never coerce null to zero. Render a visible-dot line chart with accessible title/label and monthly snapshot values, or the required selection/history empty state.
- [ ] Run `npm.cmd test`, `npm.cmd run typecheck`, and `npm.cmd run lint`.

## Task 3: Route, sidebar, export integration (TDD)

**Files:** Modify `src/App.tsx`, `src/components/portal-sidebar.tsx`, `src/data/page-config.json`, `scripts/check-production.mjs`, `scripts/check-weekly-html.mjs`; regenerate `site/index.html`, `site/assets/index-*.js`, `site/assets/index-*.css`, and `site/MI_TAM_Latest_Results.html` plus existing export files changed by the build.

**Interfaces:** Add `PortalPage` member `"latest-results"`; add config `{ "hash": "#latest-results", "exportFileName": "MI_TAM_Latest_Results.html", "originalExcelUrl": null }`; add `LatestResultsPage` branch and `MI TAM` sidebar child label `Latest Results`.

- [ ] Add RED assertions for sidebar label/hash, App header `MI TAM / LATEST RESULTS`, title `조사기관별 최신 실적`, `PageActions page="latest-results"`, config/export target, invalid-hash fallback to Sigma, and standalone export bootstrapping `latest-results` without `<aside>`/`PageActions`.
- [ ] Run `npm.cmd test`; expect route/export assertions to fail before wiring.
- [ ] Reuse `PAGE_CONFIG`, `pageFromHash`, `navigate`, `DashboardShell`, `PageActions`, and `buildAllPageHtml`; do not alter existing route behavior. Preserve disabled null Excel handling and create the new standalone file through the existing pipeline.
- [ ] Run `npm.cmd run build`, then `node scripts/check-weekly-html.mjs`; verify `Test-Path ..\..\site\MI_TAM_Latest_Results.html` is `True`.

## Task 4: Consolidated final checks

**Files:** No new implementation files; inspect only the planned source/check/generated outputs.

- [ ] From `prototype/mi-dashboard-shadcn`, run `npm.cmd test`, `npm.cmd run typecheck`, `npm.cmd run lint`, and `npm.cmd run build`.
- [ ] Run `git diff --check`; inspect `git status --short` and confirm no `.superpowers/` files were staged, no implementation placeholders (`TBD`, `TODO`, `test.skip`, `test.only`) exist in changed files, and no unrelated routes/exports changed.
- [ ] Browser-check `http://127.0.0.1:8000/#latest-results` and `site/MI_TAM_Latest_Results.html`: title/actions, 10 rows, 6 agencies/4 quarters, toggle `aria-pressed`, Forecast click/title/month dots, empty states, source-link/no-link behavior, refresh/back/forward, and no horizontal scrollbar.
- [ ] Leave changes uncommitted and report the exact passing commands and any pre-existing dirty state.
