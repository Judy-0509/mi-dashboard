# MI Insight Weekly Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** Add the MI Insight → Weekly Report page with replaceable seed data, a latest-first EDM report table, shared page actions, and a standalone HTML export.

**Architecture:** Keep the static React portal and existing page configuration as the source of truth. A page-specific data module feeds one report component; existing \`App\`, \`PortalSidebar\`, \`PageActions\`, and generic HTML packager provide routing, actions, and export without new abstractions.

**Tech Stack:** React 19, TypeScript, Vite 8, Tailwind CSS 4, existing shadcn/ui primitives, Lucide icons, Node assertion scripts.

## Global Constraints

- Route key and hash are exactly \`mi-insight\` and \`#mi-insight\`.
- The page has 1–3 Executive Summary bullets and exactly seven table columns: \`파일명\`, \`조사기관\`, \`응용처\`, \`주기\`, \`업로드일자\`, \`공유내용\`, \`파일 EDM 링크\`.
- \`uploadDate\` is \`YYYY-MM-DD\`; rows are always latest first with no user-controlled sort.
- \`sharedContent\` is limited to two visible lines; \`edmUrl: null\` is plain non-clickable text.
- The original Excel action remains disabled until configured; live HTML export is \`MI_Insight_Weekly_Report.html\`.
- The export is standalone with no sidebar or \`PageActions\`; no EDM fetch, new dependency, or new exporter is allowed.
- Do not add search, filters, pagination, interactive sorting, charts, CRUD, or visible \`MOCK\` branding. Do not push.

---

## File Structure

- Create: \`prototype/mi-dashboard-shadcn/src/data/mi-insight.ts\` — report type, three seed insights, report rows, and latest-first getter.
- Create: \`prototype/mi-dashboard-shadcn/src/components/mi-insight-weekly-report.tsx\` — summary card and semantic table.
- Modify: \`prototype/mi-dashboard-shadcn/src/components/portal-sidebar.tsx\`, \`src/App.tsx\`, \`src/data/page-config.json\` — route, navigation, header, and shared actions.
- Modify: \`prototype/mi-dashboard-shadcn/scripts/check-production.mjs\` — minimal data, route, and table-contract assertions.
- Modify: \`prototype/mi-dashboard-shadcn/scripts/check-weekly-html.mjs\` — assert the new generic export target.
- Verify/regenerate: \`site/index.html\`, \`site/assets/index-*.js\`, \`site/assets/index-*.css\`, \`site/MI_Insight_Weekly_Report.html\`.

### Task 1: Add replaceable MI Insight data and report table

**Files:**
- Create: \`prototype/mi-dashboard-shadcn/src/data/mi-insight.ts\`
- Create: \`prototype/mi-dashboard-shadcn/src/components/mi-insight-weekly-report.tsx\`
- Modify: \`prototype/mi-dashboard-shadcn/scripts/check-production.mjs\`

**Interfaces:**

~~~ts
export type MiInsightReport = {
  fileName: string
  researchProvider: string
  useCase: string
  cadence: string
  uploadDate: string
  sharedContent: string
  edmUrl: string | null
}

export const miInsightInsights: readonly string[]
export const miInsightReports: readonly MiInsightReport[]
export function getMiInsightReports(): MiInsightReport[]
export function MiInsightWeeklyReport(): JSX.Element
~~~

- [ ] **Step 1: Add data assertions before implementation.** Import the data exports in \`check-production.mjs\` and assert 1–3 insights, at least one row, all required field names, \`YYYY-MM-DD\` dates, and \`getMiInsightReports()\` ordered by descending \`uploadDate\`.
- [ ] **Step 2: Run the red data check.**

~~~powershell
Set-Location prototype\mi-dashboard-shadcn
npm.cmd test
~~~

Expected: the new imports/assertions fail because the data module does not exist.
- [ ] **Step 3: Implement the smallest data module and component.** Seed three insights and representative smartphone-market rows in \`mi-insight.ts\`; make \`getMiInsightReports()\` return a copied array sorted by \`uploadDate\` descending. Render the summary as an unordered list and the seven-column semantic table in \`MiInsightWeeklyReport\`; clamp shared content to two lines and render \`원본 보기\` with an icon only when \`edmUrl\` is present, otherwise \`원본 링크 없음\`. Use existing \`Card\` primitives and no new table abstraction.
- [ ] **Step 4: Run the green data check and commit.**

~~~powershell
npm.cmd test
git add src/data/mi-insight.ts src/components/mi-insight-weekly-report.tsx scripts/check-production.mjs
git commit -m "feat: add MI Insight report data and table"
~~~

Expected: exit \`0\`; no unrelated files are staged.

### Task 2: Wire route, sidebar, header actions, and page configuration

**Files:**
- Modify: \`prototype/mi-dashboard-shadcn/src/components/portal-sidebar.tsx\`
- Modify: \`prototype/mi-dashboard-shadcn/src/App.tsx\`
- Modify: \`prototype/mi-dashboard-shadcn/src/data/page-config.json\`
- Modify: \`prototype/mi-dashboard-shadcn/scripts/check-production.mjs\`

**Interfaces:**

~~~ts
type PortalPage = "sigma" | "weekly" | "ani" | "sell-through" | "mi-insight"

// page-config.json
"mi-insight": {
  "hash": "#mi-insight",
  "exportFileName": "MI_Insight_Weekly_Report.html",
  "originalExcelUrl": null
}
~~~

- [ ] **Step 1: Add route/source assertions and run them red.** Assert \`MI Insight\`, \`Weekly Report\`, \`#mi-insight\`, \`PageActions page="mi-insight"\`, \`MI Insight / Weekly Report\`, and the configured export filename in \`check-production.mjs\`; run \`npm.cmd test\` and confirm the assertions fail before the route exists.
- [ ] **Step 2: Add the route and navigation.** Extend \`PortalPage\`, add the MI Insight group after Counterpoint and before ANI, add the \`page-config.json\` entry, and render \`MiInsightWeeklyReport\` from a new \`MIInsightPage\` branch. Use the existing header grammar and \`PageActions\`; leave the original Excel URL \`null\`. Keep the shell's page-scroll list unchanged so the report table owns its vertical scroll region.
- [ ] **Step 3: Run checks and commit.**

~~~powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run lint
git add src/components/portal-sidebar.tsx src/App.tsx src/data/page-config.json scripts/check-production.mjs
git commit -m "feat: add MI Insight weekly report route"
~~~

Expected: all checks pass and direct \`#mi-insight\` navigation resolves to the new page.

### Task 3: Verify generic export, build, and browser behavior

**Files:**
- Modify: \`prototype/mi-dashboard-shadcn/scripts/check-weekly-html.mjs\`
- Verify: \`prototype/mi-dashboard-shadcn/scripts/build-weekly-html.mjs\`, \`package.json\`
- Regenerate: \`site/index.html\`, \`site/assets/index-*.js\`, \`site/assets/index-*.css\`, \`site/MI_Insight_Weekly_Report.html\`

**Interfaces:** The existing \`buildAllPageHtml({ siteDir })\` reads \`page-config.json\`; adding the config entry must produce the new target without changing the exporter API.

- [ ] **Step 1: Extend the existing exporter check.** In \`check-weekly-html.mjs\`, find the \`mi-insight\` entry in \`pageExportTargets\`, assert its output name and hash bootstrap, and assert the generated HTML has no \`<aside>\` or \`PageActions\` markup and no external script/stylesheet/font references. Do not add exporter logic.
- [ ] **Step 2: Run the full build checks.**

~~~powershell
npm.cmd test
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
~~~

Expected: all commands exit \`0\` and \`site/MI_Insight_Weekly_Report.html\` exists.
- [ ] **Step 3: Browser smoke-check live and standalone pages.** Open \`http://127.0.0.1:8000/#mi-insight\` at 1440 × 900 and confirm sidebar/header, 1–3 insights, all columns, newest-first rows, two-line content, EDM link treatment, disabled Excel action, HTML action, and no horizontal overflow. Open \`site/MI_Insight_Weekly_Report.html\` directly with \`file://\` and confirm the same report without sidebar/actions.
- [ ] **Step 4: Inspect, stage, and commit without pushing.**

~~~powershell
git diff --check
git add scripts/check-weekly-html.mjs site/index.html site/MI_Insight_Weekly_Report.html
git add -u -- site/assets
git add -- site/assets/index-*.js site/assets/index-*.css
git diff --cached --check
git commit -m "feat: add MI Insight weekly report export"
git status --short --branch
~~~

Expected: only planned source/checker/generated files are staged and the worktree is clean apart from any pre-existing state.

## Plan Self-Review

- Coverage: Task 1 covers data, summary, table, fixed order, line clamp, and null-link rendering; Task 2 covers route, sidebar, header, shared actions, and config; Task 3 covers the existing generic exporter, build checks, standalone export, and browser QA.
- Type consistency: \`mi-insight\` is added to \`PortalPage\`; \`page-config.json\` is consumed as \`Record<PortalPage, PageConfig>\`; component and data exports use the names above.
- Scope check: no new dependency, network integration, exporter, abstraction, search/filter/sort UI, or unrelated provider change is planned.
- Marker scan: no unresolved implementation markers or omitted file/interface names remain in this plan.
