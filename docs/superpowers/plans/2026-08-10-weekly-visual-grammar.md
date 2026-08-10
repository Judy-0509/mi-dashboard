# Counterpoint Weekly Visual Grammar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the desktop Counterpoint Weekly page so its header, cards, layout, and legend follow SigmaIntel's visual grammar while preserving every existing Weekly data calculation and interaction.

**Architecture:** Keep the current `WeeklyPage -> WeeklyAnalysis -> weekly.ts` flow intact. Make the two visual source edits in `App.tsx` and `weekly-analysis.tsx`; extend the existing Node assertion script with source-contract assertions so a future visual regression fails `npm test` before a browser review. Build with Vite into the already tracked root `site/` package, then smoke-test that package at the reference desktop viewport.

**Tech Stack:** React 19, TypeScript, Vite 8, Tailwind CSS 4, shadcn/ui, react-aria-components, Recharts 3, Node `assert`, Python static server.

## Global Constraints

- Scope is Counterpoint Weekly desktop UI only, at a 1440 x 900 px reference viewport; vertical scrolling is allowed and horizontal scrolling is not.
- Use the approved Korean metadata copy: `기준: 2026 W32 · 단위: Mu`.
- Reuse the current `Card`, `ToggleGroup`, `ChartContainer`, `ChartTooltip`, data getters, colors, and local `metric`/`region` state. Do not add a dependency, shared chart abstraction, data field, calculation, loading state, error boundary, or responsive mobile/tablet work.
- Keep the Weekly header, Executive Summary content, heatmap semantics, chart type, stack order, labels, tooltip, `accessibilityLayer`, and all current selector behavior. Only the cumulative chart's Y axis is hidden.
- The analysis row must be `minmax(0, 58fr) minmax(0, 42fr)` with the existing `gap-4`; both direct cards and the nested chart plot must be shrinkable with `min-w-0`.
- The cumulative-card content must be a shrinkable plot plus a fixed `140px` right-side semantic legend. The legend is informational, vertical, and derived from `cumulative.years[0].segments` in stack order.
- Build configuration stays `base: "./"` and `outDir: "../../site"`; generated `site/` is committed with its changed hashed JS/CSS assets.

## File Structure

- Modify: `prototype/mi-dashboard-shadcn/src/App.tsx` — replace only Weekly's right-side metadata copy.
- Modify: `prototype/mi-dashboard-shadcn/src/components/weekly-analysis.tsx` — apply the 58:42 row, Sigma-style card titles, shrink rules, hidden Y axis, and right-side semantic legend.
- Modify: `prototype/mi-dashboard-shadcn/scripts/check-production.mjs` — add stable Node source-contract assertions for the Weekly visual requirements; preserve all data assertions.
- Regenerate: `site/index.html`, `site/assets/index-*.js`, `site/assets/index-*.css` — Vite output consumed by GitHub Pages and `scripts/serve_dashboard.py`.
- Do not modify: `src/data/weekly.ts`, `weekly-executive-summary.tsx`, shadcn primitives, `vite.config.ts`, `scripts/serve_dashboard.py`, legacy root `scripts/check_weekly_redesign.js`, or font assets.

---

### Task 1: Add the Weekly visual source-contract check

**Files:**
- Modify: `prototype/mi-dashboard-shadcn/scripts/check-production.mjs:1-116`
- Test: `prototype/mi-dashboard-shadcn/scripts/check-production.mjs` through the existing `npm test` command

**Interfaces:**
- Consumes: UTF-8 source text from `src/App.tsx` and `src/components/weekly-analysis.tsx`.
- Produces: `npm test` fails if the required header copy, 58:42 shrinkable layout, title hierarchy, hidden Y axis, or semantic right-side legend contract is removed.

- [ ] **Step 1: Add a failing source contract after the existing `node:assert/strict` import and before the final success log.**

  Add the filesystem import:

  ```js
  import { readFileSync } from "node:fs"
  ```

  Add this complete assertion block immediately before `console.log("production and weekly data checks passed")`:

  ```js
  const appSource = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8")
  const weeklyAnalysisSource = readFileSync(
    new URL("../src/components/weekly-analysis.tsx", import.meta.url),
    "utf8"
  )

  assert.match(appSource, /기준: 2026 W32 · 단위: Mu/)
  assert.match(
    weeklyAnalysisSource,
    /grid-cols-\[minmax\(0,58fr\)_minmax\(0,42fr\)\] gap-4/
  )
  assert.match(
    weeklyAnalysisSource,
    /<Card className="min-w-0 border-border shadow-none" size="sm">/
  )
  assert.match(
    weeklyAnalysisSource,
    /text-xl font-semibold tracking-tight/
  )
  assert.match(weeklyAnalysisSource, /<YAxis hide \/>/)
  assert.match(
    weeklyAnalysisSource,
    /grid-cols-\[minmax\(0,1fr\)_140px\] gap-3/
  )
  assert.match(
    weeklyAnalysisSource,
    /<ChartContainer\s+className="h-\[340px\] min-w-0 w-full"/
  )
  assert.match(
    weeklyAnalysisSource,
    /<ul\s+aria-label="Cumulative composition legend"/
  )
  assert.match(
    weeklyAnalysisSource,
    /cumulative\.years\[0\]\.segments\.map\(\(segment\) =>/
  )
  assert.doesNotMatch(
    weeklyAnalysisSource,
    /className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground"/
  )
  ```

- [ ] **Step 2: Run the existing test command to prove the source contract is red.**

  Run:

  ```powershell
  Set-Location 'C:\Users\jieun\Desktop\★2026_Real\07_iphone wiki\.worktrees\weekly-visual-grammar\prototype\mi-dashboard-shadcn'
  npm.cmd test
  ```

  Expected: FAIL with an `AssertionError` for the absent `기준: 2026 W32 · 단위: Mu` source text. The existing Weekly data assertions must run before this failure.

- [ ] **Step 3: Leave the new check in place without changing data assertions or package scripts.**

  The script remains the only test entry point:

  ```json
  "test": "node --experimental-strip-types scripts/check-production.mjs"
  ```

- [ ] **Step 4: Do not commit this red-only checkpoint.**

  Keep Task 1's test change unstaged until Task 2 makes it green, so the branch never contains a known failing test commit.

### Task 2: Apply the minimal Weekly visual grammar changes

**Files:**
- Modify: `prototype/mi-dashboard-shadcn/src/App.tsx:60-62`
- Modify: `prototype/mi-dashboard-shadcn/src/components/weekly-analysis.tsx:2,65-241`
- Test: `prototype/mi-dashboard-shadcn/scripts/check-production.mjs`

**Interfaces:**
- Consumes: existing `WeeklyAnalysis` state (`metric: WeeklyMetric`, `region: WeeklyRegion`), `getWeeklyHeatmap(metric)`, and `getWeeklyCumulative(region)`.
- Produces: the same selectors and chart data with a 58:42 analysis row; a right-side legend sourced from `cumulative.years[0].segments`; no visible cumulative Y axis.

- [ ] **Step 1: Replace only the Weekly header metadata in `App.tsx`.**

  Replace the current literal inside the right-side `<p>` in `WeeklyPage` with:

  ```tsx
  <p className="font-mono text-xs text-muted-foreground">
    기준: 2026 W32 · 단위: Mu
  </p>
  ```

  Do not alter `SigmaPage`, the hash routing, `DashboardShell`, `weeklyTitle`, or `weeklyDescription`.

- [ ] **Step 2: Change the analysis row and both cards to the required shrinkable 58:42 layout.**

  Replace the section opening and the first card opening with:

  ```tsx
  <section
    className="grid grid-cols-[minmax(0,58fr)_minmax(0,42fr)] gap-4"
    aria-label="Weekly market analysis"
  >
    <Card className="min-w-0 border-border shadow-none" size="sm">
  ```

  Use the same `className="min-w-0 border-border shadow-none"` on the cumulative card. Keep `gap-4`, `size="sm"`, the existing header border, the heatmap table, and the current `ToggleGroup` props unchanged.

- [ ] **Step 3: Apply the Sigma card-title hierarchy without adding new copy.**

  In both existing `CardTitle` elements, replace `text-base font-semibold` with this exact class list:

  ```tsx
  className="mt-1 text-xl font-semibold tracking-tight"
  ```

  The resulting existing headings must remain exactly:

  ```tsx
  <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
    Weekly market mix
  </p>
  <CardTitle className="mt-1 text-xl font-semibold tracking-tight">
    Vendor × Region
  </CardTitle>
  ```

  ```tsx
  <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
    Cumulative sell-out
  </p>
  <CardTitle className="mt-1 text-xl font-semibold tracking-tight">
    4-year cumulative composition
  </CardTitle>
  ```

- [ ] **Step 4: Replace only the cumulative content layout, Y axis, and legend.**

  Keep the existing `BarChart`, `CartesianGrid`, `XAxis`, `ChartTooltip`, all `<Bar>`/`<LabelList>` code, and `accessibilityLayer`. Replace the current `CardContent` body with this structure, retaining the current chart children where marked:

  ```tsx
  <CardContent className="pt-3">
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_140px] gap-3">
      <ChartContainer
        className="h-[340px] min-w-0 w-full"
        config={weeklyChartConfig}
      >
        <BarChart
          accessibilityLayer
          barCategoryGap="28%"
          data={chartData}
          margin={{ top: 24, right: 4, left: 4, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="year"
            tickLine={false}
            tickMargin={8}
          />
          <YAxis hide />
          <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
          {cumulative.segmentNames.map((segmentName, index) => (
            <Bar
              dataKey={segmentName}
              fill={`var(--color-${segmentName})`}
              isAnimationActive={false}
              key={segmentName}
              stackId="weekly"
            >
              <LabelList
                dataKey={segmentName}
                fill={
                  index === 0 || index === 5
                    ? "var(--foreground)"
                    : "var(--primary-foreground)"
                }
                fontSize={9}
                formatter={(value) => Number(value).toFixed(1)}
                position="center"
              />
              {index === cumulative.segmentNames.length - 1 ? (
                <LabelList
                  dataKey="total"
                  fill="var(--foreground)"
                  fontSize={10}
                  formatter={(value) => `${Number(value).toFixed(1)}Mu`}
                  position="top"
                />
              ) : null}
            </Bar>
          ))}
        </BarChart>
      </ChartContainer>
      <ul
        aria-label="Cumulative composition legend"
        className="flex flex-col gap-1.5 pt-1 text-xs text-muted-foreground"
      >
        {cumulative.years[0].segments.map((segment) => (
          <li className="flex items-center gap-1.5" key={segment.name}>
            <i
              aria-hidden="true"
              className="size-2 shrink-0"
              style={{ backgroundColor: segment.color }}
            />
            {segment.name}
          </li>
        ))}
      </ul>
    </div>
  </CardContent>
  ```

  Remove the former bottom `<div>` legend entirely. Keep the `YAxis` import because the replacement is still a Recharts `<YAxis hide />` element. The `<ul>` uses the existing segment color and name and remains non-interactive.

- [ ] **Step 5: Run the source contract and static quality checks.**

  Run:

  ```powershell
  Set-Location 'C:\Users\jieun\Desktop\★2026_Real\07_iphone wiki\.worktrees\weekly-visual-grammar\prototype\mi-dashboard-shadcn'
  npm.cmd test
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  npm.cmd run lint
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  npm.cmd run typecheck
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  ```

  Expected: all commands exit `0`; `npm.cmd test` prints `production and weekly data checks passed`. This confirms data contracts still pass and the source contains the intended visual structure.

- [ ] **Step 6: Review the minimal source diff before generating assets.**

  Run:

  ```powershell
  Set-Location 'C:\Users\jieun\Desktop\★2026_Real\07_iphone wiki\.worktrees\weekly-visual-grammar'
  git diff --check
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  git diff -- prototype/mi-dashboard-shadcn/src/App.tsx prototype/mi-dashboard-shadcn/src/components/weekly-analysis.tsx prototype/mi-dashboard-shadcn/scripts/check-production.mjs
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  ```

  Expected: no whitespace errors; source diff is limited to the metadata copy, visual grammar classes/legend/Y-axis, and the test contract. No `weekly.ts` change appears.

### Task 3: Generate the tracked package and complete desktop browser QA

**Files:**
- Regenerate: `site/index.html`, `site/assets/index-*.js`, `site/assets/index-*.css`
- Verify only: `scripts/serve_dashboard.py`, the built `site/` package, and `#weekly` in a browser

**Interfaces:**
- Consumes: Vite's fixed `base: "./"` and `outDir: "../../site"`, plus the root static server's `site/` document root.
- Produces: a deployable static package whose hashed JS/CSS references exist and whose Weekly desktop page satisfies the visual and interaction acceptance criteria.

- [ ] **Step 1: Run the production build from the Vite project.**

  Run:

  ```powershell
  Set-Location 'C:\Users\jieun\Desktop\★2026_Real\07_iphone wiki\.worktrees\weekly-visual-grammar\prototype\mi-dashboard-shadcn'
  npm.cmd run build
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  ```

  Expected: `tsc -b && vite build` exits `0` and writes the new root `site/` package. Do not hand-edit generated files.

- [ ] **Step 2: Verify the generated index and exact referenced assets before browser work.**

  Run:

  ```powershell
  Set-Location 'C:\Users\jieun\Desktop\★2026_Real\07_iphone wiki\.worktrees\weekly-visual-grammar'
  $index = Get-Content -LiteralPath 'site\index.html' -Raw
  $assetRefs = [regex]::Matches($index, '(?:src|href)="\./(assets/index-[^"]+\.(?:js|css))"') |
    ForEach-Object { $_.Groups[1].Value } |
    Sort-Object -Unique
  if ($assetRefs.Count -ne 2) { throw "Expected one hashed JS and one hashed CSS asset; found: $($assetRefs -join ', ')" }
  foreach ($assetRef in $assetRefs) {
    if (-not (Test-Path -LiteralPath (Join-Path 'site' $assetRef) -PathType Leaf)) {
      throw "Missing built asset: $assetRef"
    }
  }
  if ($index -notmatch '<title>MI Intelligence Portal</title>') {
    throw 'Unexpected generated page title'
  }
  $assetRefs
  ```

  Expected: exactly one `assets/index-*.js` and one `assets/index-*.css` reference, both present under `site/`, and the expected title. Font assets and `site/mi-mark.svg` remain present but are not regenerated by this UI change.

- [ ] **Step 3: Reserve port 8014, serve the generated package on loopback, and validate page identity before browser QA.**

  In one PowerShell window, run:

  ```powershell
  Set-Location 'C:\Users\jieun\Desktop\★2026_Real\07_iphone wiki\.worktrees\weekly-visual-grammar'
  $port = 8014
  $listener = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue
  if ($listener) { throw "Port $port is already in use; stop that listener and rerun this exact check." }
  python scripts\serve_dashboard.py --host 127.0.0.1 --port $port
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  ```

  The server is intentionally foregrounded. It must report that it started on port `8014`; do not select another port. In a second PowerShell window, run this identity check before opening the browser:

  ```powershell
  Set-Location 'C:\Users\jieun\Desktop\★2026_Real\07_iphone wiki\.worktrees\weekly-visual-grammar'
  $localIndex = Get-Content -LiteralPath 'site\index.html' -Raw
  $servedIndex = (Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:8014/' -ErrorAction Stop).Content
  $assetPattern = '(?:src|href)="\./(assets/index-[^"]+\.(?:js|css))"'
  $localTitle = [regex]::Match($localIndex, '<title>([^<]+)</title>').Groups[1].Value
  $servedTitle = [regex]::Match($servedIndex, '<title>([^<]+)</title>').Groups[1].Value
  $localRefs = [regex]::Matches($localIndex, $assetPattern) |
    ForEach-Object { $_.Groups[1].Value } |
    Sort-Object -Unique
  $servedRefs = [regex]::Matches($servedIndex, $assetPattern) |
    ForEach-Object { $_.Groups[1].Value } |
    Sort-Object -Unique
  if ($localTitle -ne 'MI Intelligence Portal' -or $servedTitle -ne $localTitle) {
    throw "Unexpected served title: $servedTitle"
  }
  if (@(Compare-Object -ReferenceObject $localRefs -DifferenceObject $servedRefs).Count -ne 0) {
    throw "Served JS/CSS references differ from site/index.html: $((Compare-Object -ReferenceObject $localRefs -DifferenceObject $servedRefs | Out-String).Trim())"
  }
  $servedTitle
  $servedRefs
  ```

  Expected: the served page title is `MI Intelligence Portal`, and its one hashed `assets/index-*.js` reference and one hashed `assets/index-*.css` reference exactly equal the local `site/index.html` references. Only then open `http://127.0.0.1:8014/#weekly` in a browser, set the viewport to `1440 x 900`, clear the console, and hard-refresh. Confirm the Weekly header shows `기준: 2026 W32 · 단위: Mu`, the Executive Summary remains present, and the left heatmap is visibly wider than the cumulative card.

  At the default Total/YoY state and after every state change below, run this in DevTools Console:

  ```js
  const overflowTargets = [
    document.documentElement,
    document.body,
    document.querySelector("main"),
    ...document.querySelectorAll(
      '[data-slot="card"], table, .recharts-responsive-container'
    ),
  ].filter(Boolean)
  const overflowed = overflowTargets.filter((element) =>
    element.scrollWidth > element.clientWidth
  )
  console.assert(overflowed.length === 0, overflowed)
  ```

  Expected: `overflowed` is empty; no new Console errors occur.

- [ ] **Step 4: Check every retained control state and accessibility surface.**

  1. Click `WoW`; confirm the first heatmap data cell changes from `+6.8%` to `-0.2%`, the selected styling moves to `WoW`, and the cumulative card does not change. Click `YoY` and confirm `+6.8%` returns.
  2. Click each cumulative selector in this order: `Total`, `USA`, `China`, `Japan`, `Europe`, `India`. For `Total`, confirm the right-side legend is vertical and lists `USA, China, Japan, Europe, India`; for every named region, confirm it lists `Apple, Samsung, Xiaomi, OPPO, vivo, Honor, Others`. Confirm each selected button remains visually distinct and that bars, total labels, and legend update together.
  3. Use `Tab` until each YoY/WoW and region toggle is reached; use `Space` to select a non-default option, then restore `YoY` and `Total`. Confirm focus remains visibly indicated and the selected option is announced by the native toggle control.
  4. Hover a cumulative bar and confirm the existing tooltip renders. Confirm the chart still exposes its Recharts accessibility layer and the heatmap is still a semantic `<table>` with row headers.
  5. Confirm the cumulative plot has X-axis years, grid lines, stacked labels, and totals, but no visible Y-axis line, ticks, or `Mu` labels. Confirm the legend is a `<ul aria-label="Cumulative composition legend">`, is not below the plot, and has no button/filter behavior.

  Expected: all states retain their previous calculation semantics, no horizontal scrollbar appears in the page, cards, table, or chart, and Console remains error-free.

- [ ] **Step 5: Check the final change scope, stage source plus tracked build output, and commit the green implementation.**

  Run:

  ```powershell
  Set-Location 'C:\Users\jieun\Desktop\★2026_Real\07_iphone wiki\.worktrees\weekly-visual-grammar'
  $trackedChanged = git diff --name-only
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  $untrackedChanged = git ls-files --others --exclude-standard
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  $changed = @($trackedChanged; $untrackedChanged) | Sort-Object -Unique
  $unexpected = $changed | Where-Object {
    $_ -notin @(
      'prototype/mi-dashboard-shadcn/src/App.tsx',
      'prototype/mi-dashboard-shadcn/src/components/weekly-analysis.tsx',
      'prototype/mi-dashboard-shadcn/scripts/check-production.mjs',
      'site/index.html'
    ) -and $_ -notmatch '^site/assets/index-[^/]+\.(?:js|css)$'
  }
  if ($unexpected) { throw "Unexpected changed paths: $($unexpected -join ', ')" }
  $index = Get-Content -LiteralPath 'site\index.html' -Raw
  $assetRefs = [regex]::Matches($index, '(?:src|href)="\./(assets/index-[^"]+\.(?:js|css))"') |
    ForEach-Object { "site/$($_.Groups[1].Value)" } |
    Sort-Object -Unique
  if ($assetRefs.Count -ne 2 -or ($assetRefs | Where-Object { -not (Test-Path -LiteralPath $_ -PathType Leaf) })) {
    throw "Verified generated JS/CSS assets are missing or incomplete: $($assetRefs -join ', ')"
  }
  git add prototype/mi-dashboard-shadcn/src/App.tsx prototype/mi-dashboard-shadcn/src/components/weekly-analysis.tsx prototype/mi-dashboard-shadcn/scripts/check-production.mjs site/index.html
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  git add -u -- site/assets
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  git add -- $assetRefs
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  git diff --cached --check
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  $staged = git diff --cached --name-only
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  $unexpectedStaged = $staged | Where-Object {
    $_ -notin @(
      'prototype/mi-dashboard-shadcn/src/App.tsx',
      'prototype/mi-dashboard-shadcn/src/components/weekly-analysis.tsx',
      'prototype/mi-dashboard-shadcn/scripts/check-production.mjs',
      'site/index.html'
    ) -and $_ -notmatch '^site/assets/index-[^/]+\.(?:js|css)$'
  }
  if ($unexpectedStaged) { throw "Unexpected staged paths: $($unexpectedStaged -join ', ')" }
  $staged
  git commit -m "style: align Weekly visual grammar"
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  git status --short --branch
  ```

  Expected: staged paths are exactly the three source files, `site/index.html`, and replacement `site/assets/index-*.js`/`site/assets/index-*.css` files. No data, Vite, server, legacy-check, font, or documentation file is staged. The commit succeeds and the final status is clean on `feat/weekly-visual-grammar`.
