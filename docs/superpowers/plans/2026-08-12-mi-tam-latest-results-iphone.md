# MI TAM Latest Results (iPhone) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a separate MI TAM Latest Results (iPhone) page for all 20 ANI production models while preserving the existing vendor page.

**Architecture:** Generalize the existing latest-results page, table, and forecast-history chart around a row-key dataset contract. Supply a separate deterministic iPhone fixture that imports `aniModels`, then route and export it through the existing shell and standalone HTML pipeline.

**Tech Stack:** React 19, TypeScript, Recharts, Vite, existing Node assertion scripts.

## Global Constraints

- Reuse the existing page/table/chart path; do not copy a second implementation.
- Keep `#latest-results` behavior and output unchanged.
- Use all 20 `aniModels` in exported order with their existing labels and colors.
- Actual wins over Forecast; Forecast displays `(F)` and alone is clickable; missing displays `—`; explicit zero is valid.
- No new dependency, DB/API integration, authentication, aggregate rows, or mobile redesign.

---

### Task 1: Shared latest-results contract and iPhone fixture

**Files:**
- Modify: `prototype/mi-dashboard-shadcn/src/data/latest-results.ts`
- Create: `prototype/mi-dashboard-shadcn/src/data/latest-results-iphone.ts`
- Modify: `prototype/mi-dashboard-shadcn/src/components/latest-results-page.tsx`
- Modify: `prototype/mi-dashboard-shadcn/src/components/latest-results-table.tsx`
- Modify: `prototype/mi-dashboard-shadcn/src/components/forecast-history-chart.tsx`
- Test: `prototype/mi-dashboard-shadcn/scripts/check-production.mjs`

**Interfaces:**
- Produce a generic `LatestResultsDataset<RowKey extends string>` with quarters, agencies, rows, and complete cells.
- Produce `latestResultsIPhoneDataset` whose row keys are `AniModelKey` and whose rows derive directly from `aniModels`.
- Shared components consume dataset, page copy, and selected row key; the vendor page receives an adapter preserving its aggregate rows.

- [ ] Add failing assertions for 20-model order/color identity, 6 agencies, 4 quarters, complete dimensions, Actual precedence, explicit zero, missing, Forecast history, and existing vendor aggregates.
- [ ] Run `node --experimental-strip-types scripts/check-production.mjs`; expect failure because the iPhone dataset and generic interfaces do not exist.
- [ ] Implement the minimum generic contract and deterministic iPhone fixture, then pass dataset/page configuration into the existing components.
- [ ] Render the model color swatch beside each iPhone row label with the text label retained.
- [ ] Re-run the production checker; expect all new and existing latest-results assertions to pass.

### Task 2: Route, navigation, actions, and standalone export

**Files:**
- Modify: `prototype/mi-dashboard-shadcn/src/components/portal-sidebar.tsx`
- Modify: `prototype/mi-dashboard-shadcn/src/data/page-config.json`
- Modify: `prototype/mi-dashboard-shadcn/src/App.tsx`
- Modify: `prototype/mi-dashboard-shadcn/scripts/check-weekly-html.mjs`
- Regenerate: `site/index.html`, `site/assets/*`, `site/MI_TAM_Latest_Results_iPhone.html`, and existing standalone HTML files.

**Interfaces:**
- Add `PortalPage` key `latest-results-iphone`, hash `#latest-results-iphone`, and export `MI_TAM_Latest_Results_iPhone.html`.
- Render the shared latest-results page with the iPhone dataset and approved header copy.

- [ ] Add failing source/export assertions for sidebar order, route/hash, page config, page heading, and standalone export without sidebar/actions.
- [ ] Run `npm test`; expect failure because the route and export do not exist.
- [ ] Add the sidebar item directly below Latest Results, route it through `App`, keep it scrollable, and configure shared `PageActions`.
- [ ] Add the page config and let the existing exporter generate the standalone file.
- [ ] Run `npm test`; expect route and export assertions to pass.

### Task 3: Consolidated verification and commit

**Files:**
- Review every changed source and generated file from Tasks 1-2.

- [ ] Run `npm test`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Run `git diff --check` and scan changed implementation files for `TODO`, `test.skip`, and `test.only`.
- [ ] Verify `site/MI_TAM_Latest_Results_iPhone.html` bootstraps `latest-results-iphone` and contains no sidebar or PageActions.
- [ ] Verify localhost serves the latest hashed bundle and `#latest-results-iphone` is reachable.
- [ ] Commit source, checks, plan, and generated `site/` output; exclude `.superpowers/`. Do not push without user approval.
