# Weekly table/chart vertical alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
**Goal:** Align the Weekly table bottom with the unchanged cumulative plot within 1 px at 1440 × 900, and match the Sigma Forecast History legend typography.
**Architecture:** Keep `WeeklyAnalysis` and its data/control flow unchanged. The left grid-stretched card lets its existing content grow; its existing wrapper and table fill that available blank area so native table layout distributes it over current rows. The committed checker verifies only source contracts; an ignored, disposable CDP controller performs browser QA and never becomes part of `npm test`.
**Tech Stack:** React 19, Tailwind CSS 4, Vite 8, existing Node assertion checker, temporary local Chrome CDP controller.

## Global Constraints

- Desktop target is 1440 × 900: `abs(table.bottom - plot.bottom) <= 1` px.
- Do not change page, section, or card bounds; chart `h-[340px]`, chart geometry/math/data, widths, headers, controls, interactions, and responsive rules stay unchanged.
- Reallocate only existing blank left-card height through the current table header/body rows; do not add a fixed table/row height, spacer, margin, content, or mobile rule.
- Weekly legend only must be `text-sm` (14 px), `leading-5` (20 px), and `size-1.5` (6 × 6 px), without changing its content/order/placement/behavior.
- Production edits are limited to `weekly-analysis.tsx` and `check-production.mjs`; add no dependency, data field, component, test file, or CDP/WebSocket code to tracked source.
- Build regenerates root `site/`; stage source plus generated site assets only. Do not push.

---

## File Map

| Path | Responsibility |
| --- | --- |
| `prototype/mi-dashboard-shadcn/src/components/weekly-analysis.tsx` | Existing Weekly table and legend; only class-token changes belong here. |
| `prototype/mi-dashboard-shadcn/scripts/check-production.mjs` | Existing offline assertion runner; only exact source contracts are added. |
| `.gstack/weekly-vertical-qa.mjs` | Disposable, ignored local CDP controller; create for QA and do not stage. |
| `site/index.html`, `site/assets/index-*.js`, `site/assets/index-*.css` | Vite-generated Pages package. |

### Task 1: Add the failing offline source contract

**Files:**

- Modify: `prototype/mi-dashboard-shadcn/scripts/check-production.mjs:113-159`; verify `prototype/mi-dashboard-shadcn/src/components/weekly-analysis.tsx:96-131,223-234`.

**Interfaces:** Consumes the existing `weeklyAnalysisSource` string and produces an `npm test` failure if required existing-element classes are removed.

- [ ] **Step 1: Add exact assertions before editing the component.**
  Preserve all data assertions. Add source matches for these exact class contracts on the existing elements:
  ```tsx
  <CardContent className="flex flex-1 flex-col pt-3">
  <div className="flex flex-1 overflow-hidden border">
  <table className="h-full w-full border-collapse text-xs">
  <ul className="flex flex-col gap-1.5 pt-1 text-sm leading-5 text-muted-foreground">
  <i aria-hidden="true" className="size-1.5 shrink-0" />
  ```
  Keep the existing assertions for the two cards, 58:42 grid, hidden Y axis, 340 px chart, semantic legend label, and segment mapping. Do not add command-line options, browser setup, `WebSocket`, or HTTP/CDP logic to this tracked checker.
- [ ] **Step 2: Run the red source cycle.**
  ```powershell
  Set-Location prototype\mi-dashboard-shadcn
  npm.cmd test
  ```
  Expected: FAIL before the component edit because its card content/wrapper/table lack the three fill classes and the legend remains `text-xs` with a `size-2` marker. This is the sole committed RED test.

### Task 2: Apply the minimum Weekly class changes and turn the source contract green

**Files:**

- Modify: `prototype/mi-dashboard-shadcn/src/components/weekly-analysis.tsx:96-131,223-234`; verify `prototype/mi-dashboard-shadcn/scripts/check-production.mjs:113-159`.

**Interfaces:** Consumes Task 1's exact source contract and produces table-height distribution plus Sigma-matched legend tokens without a behavior/data API change.

- [ ] **Step 1: Change only the existing Tailwind class strings.**
  Make the left `CardContent` `flex flex-1 flex-col pt-3`, its existing bordered wrapper `flex flex-1 overflow-hidden border`, and its existing table `h-full w-full border-collapse text-xs`. Retain all current cell padding, border, semantic table markup, mapping, and values. Browser table layout then shares the card's existing unused height across the current header and eight body rows.
  In the existing cumulative legend, replace only `text-xs` with `text-sm leading-5` and `size-2` with `size-1.5`. These are the exact Sigma tokens in `cumulative-production-chart.tsx:333,353`; do not create a shared component or alter legend mapping.
- [ ] **Step 2: Run the green offline cycle.**
  ```powershell
  Set-Location prototype\mi-dashboard-shadcn
  npm.cmd test
  ```
  Expected: PASS. The checker proves the source contains only the required table-height and legend contracts while retaining chart and data contracts.

### Task 3: Run disposable CDP visual QA outside the committed implementation

**Files:**

- Create locally, ignored: `.gstack/weekly-vertical-qa.mjs`
- Create locally, ignored: `.gstack/weekly-vertical-baseline.json`
- Verify only: built root `site/` served at `http://127.0.0.1:8014/#weekly`

**Interfaces:** Consumes local Chrome at `http://127.0.0.1:9222` and the static package; produces ignored baseline/final JSON never staged or imported by project code.

- [ ] **Step 1: Capture the unedited desktop baseline before Task 2.**

  Build the current source, serve it only on loopback, and run the temporary controller at 1440 × 900. It must emit `table`, right `.recharts-wrapper`, Weekly section, both direct card rects, document scroll dimensions, legend computed `fontSize`/`lineHeight`/marker rects, and console errors; save that JSON only under `.gstack/weekly-vertical-baseline.json`. The initial run is expected to show a table/plot delta over 1 px and non-Sigma legend styles, while establishing unchanged section/card/plot geometry.

- [ ] **Step 2: Run the final desktop matrix and compare it to the ignored baseline.**

  Rebuild, then use the same controller to test all 12 `YoY|WoW × Total|USA|China|Japan|Europe|India` states. For every state, wait two animation frames and assert: table/plot delta at most 1 px; right plot rect and 340 px height equal baseline; section and both card rects equal baseline within 1 px; no horizontal overflow; no `Runtime.exceptionThrown` or error-level `Log.entryAdded`. Check 14 px/20 px/6 × 6 px legend styles; `Total` labels are `USA, China, Japan, Europe, India`, while named-region labels are `Apple, Samsung, Xiaomi, OPPO, vivo, Honor, Others`.

- [ ] **Step 3: Smoke-check unchanged mobile behavior.**

  At 390 × 844, click `WoW`, `India`, then `Total`. Assert both selector groups, semantic table, plot, and legend remain present; selection updates; there is no horizontal overflow or console error. Do not apply the desktop 1 px geometry target to mobile and do not add a responsive rule.

### Task 4: Verify, regenerate site, stage the precise implementation, and commit

**Files:**

- Regenerate: `site/index.html`, replacement `site/assets/index-*.js`, replacement `site/assets/index-*.css`
- Stage only: `weekly-analysis.tsx`, `check-production.mjs`, and the generated site files

**Interfaces:** Consumes Tasks 1-3 green evidence and Vite `base: "./"`, `outDir: "../../site"`; produces the Pages static package and one narrow implementation commit.

- [ ] **Step 1: Run the project checks and build.**

  ```powershell
  Set-Location prototype\mi-dashboard-shadcn
  npm.cmd run data:check
  npm.cmd test
  npm.cmd run lint
  npm.cmd run typecheck
  npm.cmd run build
  ```

  Expected: all commands exit 0 and build writes root `site/` without a source change outside the two planned files.

- [ ] **Step 2: Scan, inspect, stage, and commit without pushing.**

  ```powershell
  Set-Location ..\..
  rg -n -i 'T[O]D[O]|T[B]D|implement[ ]later|fill[ ]in[ ]details|test\.(skip|only)' prototype\mi-dashboard-shadcn\src\components\weekly-analysis.tsx prototype\mi-dashboard-shadcn\scripts\check-production.mjs site
  git diff --check
  git add prototype/mi-dashboard-shadcn/src/components/weekly-analysis.tsx prototype/mi-dashboard-shadcn/scripts/check-production.mjs site/index.html
  git add -u -- site/assets
  git diff --cached --check
  git diff --cached --name-only
  git commit -m "fix: align Weekly table and legend"
  git status --short --branch
  ```

  Expected: no placeholder matches or whitespace errors; staged paths are exactly the two source files, `site/index.html`, and replacement hashed `site/assets/index-*` JS/CSS files. Do not stage `.gstack/`, data, package, server, legacy checker, fonts, or documentation; do not push.

## Plan Self-Review

- Coverage: Task 1 supplies the required RED source contract; Task 2 is the surgical GREEN change; Task 3 checks 1440 × 900 geometry, computed styles, all desktop states, console/overflow, and mobile without expanding committed scope; Task 4 validates and stages the production package.
- Placeholder scan: Task 4 executes the explicit scan on every tracked changed source/build target before commit.
- Consistency: committed `npm test` remains an offline source/data check; the CDP controller and its baseline are `.gstack/`-ignored, temporary QA evidence only.
## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-10-weekly-table-chart-alignment.md`. Execute task-by-task with `superpowers:subagent-driven-development`; the plan itself changes no production behavior.
