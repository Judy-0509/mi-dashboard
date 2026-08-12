# Latest Results 관계사 연간 실적 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a selectable annual affiliate-results table to the right of Latest Results and move Forecast History below both tables.

**Architecture:** Reuse the existing vendor rows and `ResultCell` semantics in a deterministic affiliate fixture. Add one focused table component and make the existing Forecast History chart consume a simple display model so agency and affiliate selections share it.

**Tech Stack:** React 19, TypeScript, Recharts, Vite, existing Node assertion checks.

## Constraints

- Apply only to `Latest Results`; do not change `Latest Results (iPhone)` content.
- Use only `LSI/A/B/D/E/F/M`; never store names or duties.
- Show `'24/'25/'26/'27` together as columns and select only the affiliate, default `LSI`.
- Keep the existing 58:42 upper layout and one full-width lower Line chart.

### Task 1: Affiliate fixture and table

**Files:**
- Create: `prototype/mi-dashboard-shadcn/src/data/affiliate-annual-results.ts`
- Create: `prototype/mi-dashboard-shadcn/src/components/affiliate-annual-results-table.tsx`
- Modify: `prototype/mi-dashboard-shadcn/scripts/check-production.mjs`

- [ ] Add failing checks for codes, years, default values, complete dimensions, row order, aggregates, Actual precedence, zero, missing, and Forecast history.
- [ ] Implement deterministic cells using existing vendor rows and `ResultCell` rules.
- [ ] Render one affiliate selector and all four year columns; only individual Forecast cells are buttons.
- [ ] Run the targeted production checker and make it pass.

### Task 2: Shared lower history layout

**Files:**
- Modify: `prototype/mi-dashboard-shadcn/src/components/latest-results-page.tsx`
- Modify: `prototype/mi-dashboard-shadcn/src/components/forecast-history-chart.tsx`
- Modify: `prototype/mi-dashboard-shadcn/src/App.tsx`

- [ ] Change Forecast History to consume `{ title, history } | null` so both source types reuse one chart.
- [ ] Pass the affiliate fixture only to the vendor Latest Results page.
- [ ] Keep both tables in the 58:42 row and render Forecast History below at full width.
- [ ] Clear the lower chart when view or affiliate changes; Forecast clicks populate it.

### Task 3: Consolidated verification

- [ ] Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`.
- [ ] Run `git diff --check` and scan changed implementation files for `TODO`, `test.skip`, and `test.only`.
- [ ] Verify the generated Latest Results standalone page includes the affiliate table while the iPhone export remains unchanged in content and free of sidebar/actions.
- [ ] Commit source, checks, plan, and generated `site/`; exclude `.superpowers/`. Do not push without a request.
