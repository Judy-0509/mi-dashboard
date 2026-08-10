# Weekly Single-HTML Download Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `Download as HTML` control only to the live Counterpoint Weekly header. It downloads a build-generated `MI_Weekly_2026W32.html` that opens directly with `file://`, starts in Weekly-only mode, and preserves Weekly interactions.

**Architecture:** Keep Vite as the production compiler. Add one dependency-free Node packager that runs after `vite build`, reads the emitted Weekly-capable app, inlines its JS, CSS, DM Sans WOFF2 files, and favicon, then writes a separate self-contained export beside `site/index.html`. A small export-mode global makes the existing React app force Weekly and renders a Weekly-only sidebar; the normal app keeps its existing hash routing. The live header uses a native downloadable link to the already-built artifact.

**Tech Stack:** React 19, TypeScript, Vite 8, Tailwind CSS 4, shadcn/ui, Node built-ins (`node:fs`, `node:path`, `node:url`, `node:assert`), existing static `site/` deployment.

## Global Constraints

- Do not add packages, runtime network fetches, a ZIP, a client-side blob builder, or a second React entry point.
- The export is current bundled mock data only. It must not reference an Excel/DB path or any internal data source.
- The export file name is exactly `MI_Weekly_2026W32.html`; update that literal when the Weekly reporting period changes.
- Normal `#overview`/SigmaIntel behavior remains unchanged. Only the live Weekly header contains the download link.
- In export mode, force Weekly even without a hash, omit SigmaIntel from the sidebar, retain Counterpoint / Weekly branding, and hide the download control.
- Escape `</script` and `</style` before inline embedding. Fail rather than emit a partial export if an expected asset is absent or if prohibited external loading references remain.
- Do not push as part of this work.

## File Structure

- Add: `prototype/mi-dashboard-shadcn/scripts/build-weekly-html.mjs` — synchronous, reusable Vite-output packager.
- Add: `prototype/mi-dashboard-shadcn/scripts/check-weekly-html.mjs` — fixture-based Node assertions for the packager.
- Modify: `prototype/mi-dashboard-shadcn/package.json` — run the packager after Vite and the focused check in `npm test`.
- Modify: `prototype/mi-dashboard-shadcn/src/App.tsx` — read export mode, force Weekly, and render the live-only download link.
- Modify: `prototype/mi-dashboard-shadcn/src/components/portal-sidebar.tsx` — accept `weeklyOnly` and filter the existing providers list.
- Regenerate: `site/index.html`, `site/assets/index-*.js`, `site/assets/index-*.css`, and `site/MI_Weekly_2026W32.html`.
- Do not modify: `src/data/**`, Weekly charts/components, `vite.config.ts`, `scripts/serve_dashboard.py`, or the root `index.html`.

---

### Task 1: Add a testable no-dependency packager

**Files:**
- Add: `prototype/mi-dashboard-shadcn/scripts/build-weekly-html.mjs`
- Add: `prototype/mi-dashboard-shadcn/scripts/check-weekly-html.mjs`

**Interfaces:**

```js
export function buildWeeklyHtml({ siteDir, outputName = "MI_Weekly_2026W32.html" })
// returns the absolute generated HTML path; throws Error on an invalid build.
```

- [ ] **Step 1: Write the focused fixture test before the packager exists.**

  Add `check-weekly-html.mjs` first. It imports the absent implementation:

  ```js
  import { buildWeeklyHtml } from "./build-weekly-html.mjs"
  ```

  It creates a temporary `site/` fixture with Vite-like `index.html`, one hashed JS file containing `</script>`, one CSS file containing a local WOFF2 URL and `</style>`, the matching WOFF2 binary, and `mi-mark.svg`. It calls `buildWeeklyHtml`, then asserts:

  ```js
  assert.equal(basename(outputPath), "MI_Weekly_2026W32.html")
  assert.match(html, /window\.__MI_WEEKLY_EXPORT__ = true/)
  assert.match(html, /<script type="module">[\s\S]*<\\\/script>/)
  assert.match(html, /<style>[\s\S]*data:font\/woff2;base64,/)
  assert.match(html, /href="data:image\/svg\+xml;base64,/)
  assert.doesNotMatch(html, /<script[^>]+\bsrc=/i)
  assert.doesNotMatch(html, /rel=["']stylesheet["']/i)
  ```

  Add a missing-JavaScript fixture assertion with `assert.throws`, and remove the temporary directory in `finally`.

- [ ] **Step 2: Run the focused test and confirm it is red.**

  ```powershell
  Set-Location 'C:\Users\jieun\Desktop\★2026_Real\07_iphone wiki\prototype\mi-dashboard-shadcn'
  node scripts\check-weekly-html.mjs
  ```

  Expected: non-zero exit with `ERR_MODULE_NOT_FOUND` for `build-weekly-html.mjs`. Do not commit this red checkpoint.

- [ ] **Step 3: Implement `buildWeeklyHtml` with Node built-ins only.**

  Resolve `siteDir`, read `index.html`, discover exactly one `assets/index-*.js` and one `assets/index-*.css` from its local `src`/`href` attributes, and read `mi-mark.svg`. Discover every `url(./*.woff2)` in the emitted CSS and replace each with a `data:font/woff2;base64,...` URI. Replace the Vite asset tags with inline tags and replace the favicon with a `data:image/svg+xml;base64,...` URI.

  Before the inline module script, inject this exact bootstrap:

  ```html
  <script>window.__MI_WEEKLY_EXPORT__ = true; window.location.hash = "#weekly";</script>
  ```

  Escape embedded source text before writing:

  ```js
  const escapeInlineScript = (value) => value.replaceAll("</script", "<\\/script")
  const escapeInlineStyle = (value) => value.replaceAll("</style", "<\\/style")
  ```

  Verify the completed document before `writeFileSync`:

  ```js
  assert.doesNotMatch(html, /<script[^>]+\bsrc=/i)
  assert.doesNotMatch(html, /<link[^>]+rel=["']stylesheet["']/i)
  assert.doesNotMatch(html, /<link[^>]+rel=["']icon["'][^>]+href=["'](?!data:)/i)
  assert.doesNotMatch(html, /url\(["']?(?!data:)[^)]+\.woff2/i)
  ```

  The direct CLI entry point calls `buildWeeklyHtml({ siteDir: path.resolve(import.meta.dirname, "../../site") })` and logs only the generated path. Guard that call so the test can import the function without generating files.

- [ ] **Step 4: Run the focused test green.**

  ```powershell
  Set-Location 'C:\Users\jieun\Desktop\★2026_Real\07_iphone wiki\prototype\mi-dashboard-shadcn'
  node scripts\check-weekly-html.mjs
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  ```

  Expected: exit `0`; the test creates no project files and confirms an invalid Vite asset reference fails closed.

### Task 2: Add export-aware Weekly routing and the live download control

**Files:**
- Modify: `prototype/mi-dashboard-shadcn/src/App.tsx`
- Modify: `prototype/mi-dashboard-shadcn/src/components/portal-sidebar.tsx`

**Interfaces:**

```ts
declare global {
  interface Window { __MI_WEEKLY_EXPORT__?: boolean }
}

type PortalSidebarProps = {
  activePage: PortalPage
  onNavigate: (page: PortalPage) => void
  weeklyOnly?: boolean
}
```

- [ ] **Step 1: Add the App/sidebar source assertions first and confirm they are red.**

  In `scripts/check-production.mjs`, read `portal-sidebar.tsx` alongside the existing `App.tsx` source and add:

  ```js
  assert.match(appSource, /window\.__MI_WEEKLY_EXPORT__ === true/)
  assert.match(appSource, /download="MI_Weekly_2026W32\.html"/)
  assert.match(appSource, /href="\.\/MI_Weekly_2026W32\.html"/)
  assert.match(appSource, /!isWeeklyExport/)
  assert.match(sidebarSource, /weeklyOnly\?: boolean/)
  assert.match(sidebarSource, /provider\.page === "weekly"/)
  ```

  Run:

  ```powershell
  Set-Location 'C:\Users\jieun\Desktop\★2026_Real\07_iphone wiki\prototype\mi-dashboard-shadcn'
  npm.cmd test
  ```

  Expected: non-zero `AssertionError` for the first missing export-mode contract. Do not commit this red checkpoint.

- [ ] **Step 2: Add one export-mode boolean at module scope in `App.tsx`.**

  Use the safe browser global, then make `pageFromHash()` return `"weekly"` when it is true:

  ```ts
  const isWeeklyExport = window.__MI_WEEKLY_EXPORT__ === true

  function pageFromHash(): PortalPage {
    return isWeeklyExport || window.location.hash === "#weekly" ? "weekly" : "sigma"
  }
  ```

  In the hash listener, keep export mode pinned to Weekly rather than allowing `#overview` to render Sigma. Pass `weeklyOnly={isWeeklyExport}` to `PortalSidebar`.

- [ ] **Step 3: Filter only the existing sidebar providers in export mode.**

  Keep the `providers` constant and its markup. Inside `PortalSidebar`, derive the displayed list with:

  ```tsx
  const visibleProviders = weeklyOnly
    ? providers.filter((provider) => provider.page === "weekly")
    : providers
  ```

  Map `visibleProviders`. This preserves the existing Counterpoint/Weekly sidebar markup but removes SigmaIntel only in the exported document.

- [ ] **Step 4: Add the Weekly header download link only for the normal site.**

  Import `Download` from `lucide-react` and `buttonVariants` from the existing UI button module. Beside the existing Weekly as-of `<p>`, render a native anchor only when `!isWeeklyExport`:

  ```tsx
  <a
    className={buttonVariants({ variant: "outline", size: "sm" })}
    download="MI_Weekly_2026W32.html"
    href="./MI_Weekly_2026W32.html"
  >
    <Download aria-hidden="true" />
    Download as HTML
  </a>
  ```

  Wrap the as-of label and link in a right-aligned flex container. Give the link an accessible name through its visible text; do not add a separate button or client-side download handler. The export's `isWeeklyExport` branch removes the link entirely.

- [ ] **Step 5: Run the App/sidebar checks green.**

  ```powershell
  Set-Location 'C:\Users\jieun\Desktop\★2026_Real\07_iphone wiki\prototype\mi-dashboard-shadcn'
  npm.cmd test
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  npm.cmd run typecheck
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  npm.cmd run lint
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  node scripts\check-weekly-html.mjs
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  ```

  Expected: export mode does not affect the regular app type/lint result.

### Task 3: Attach packing to build and generate the deployable files

**Files:**
- Modify: `prototype/mi-dashboard-shadcn/package.json`
- Regenerate: `site/index.html`, `site/assets/index-*.js`, `site/assets/index-*.css`, `site/MI_Weekly_2026W32.html`

- [ ] **Step 1: Chain the packager after Vite.**

  Replace scripts with these exact values while preserving the other commands:

  ```json
  {
    "build": "tsc -b && vite build && node scripts/build-weekly-html.mjs",
    "test": "node --experimental-strip-types scripts/check-production.mjs && node scripts/check-weekly-html.mjs"
  }
  ```

  This ensures each GitHub Actions or local production build regenerates both standard Pages assets and the downloadable offline artifact.

- [ ] **Step 2: Run the full test suite and production build.**

  ```powershell
  npm.cmd test
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  npm.cmd run build
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  ```

  Expected: both checks exit `0`, and `site/MI_Weekly_2026W32.html` exists.

- [ ] **Step 3: Static-scan the generated output.**

  ```powershell
  $exportPath = Resolve-Path '..\..\site\MI_Weekly_2026W32.html'
  $html = Get-Content -LiteralPath $exportPath -Raw
  if ($html -notmatch 'window\.__MI_WEEKLY_EXPORT__ = true') { throw 'Missing Weekly export bootstrap' }
  if ($html -notmatch 'data:font/woff2;base64,') { throw 'Fonts were not inlined' }
  if ($html -notmatch 'data:image/svg\+xml;base64,') { throw 'Favicon was not inlined' }
  if ($html -match '<script[^>]+\bsrc=') { throw 'External script remains' }
  if ($html -match '<link[^>]+rel=["'']stylesheet["'']') { throw 'External stylesheet remains' }
  if ($html -match 'url\(["'']?(?!data:)[^)]+\.woff2') { throw 'External font remains' }
  ```

  Expected: the artifact is a single document with only inline JS, CSS, fonts, and favicon.

### Task 4: Browser QA, scope check, and commit

**Files:**
- Verify: `site/MI_Weekly_2026W32.html`, live `site/index.html`, and all changed source files.

- [ ] **Step 1: Verify the downloaded export from `file://`.**

  Open the generated `site/MI_Weekly_2026W32.html` directly in a browser (not through a server). Confirm it starts on Counterpoint Weekly; no SigmaIntel sidebar entry and no `Download as HTML` control exist. Exercise:

  1. YoY and WoW;
  2. every region selector;
  3. the vendor selector;
  4. `Mu` and `M/S (%)`;
  5. stacked-bar selection and chart tooltips.

  Confirm all interactions update normally, browser DevTools has no network requests or errors, and a refresh remains Weekly-only.

- [ ] **Step 2: Regression-check the live static site.**

  Start the existing local static server and open `http://127.0.0.1:8000/#weekly`. Confirm the live Weekly header has one working `Download as HTML` link whose saved filename is `MI_Weekly_2026W32.html`. Open `http://127.0.0.1:8000/#overview` and confirm SigmaIntel has no such link and keeps its current navigation/layout.

- [ ] **Step 3: Review generated and source output before committing.**

  ```powershell
  Set-Location 'C:\Users\jieun\Desktop\★2026_Real\07_iphone wiki'
  git diff --check
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  git status --short
  ```

  Expected changed paths are limited to the two new scripts, `package.json`, `App.tsx`, `portal-sidebar.tsx`, `check-production.mjs`, root `site/index.html`, replaced hashed `site/assets/index-*` files, and `site/MI_Weekly_2026W32.html`. Do not stage unrelated files.

- [ ] **Step 4: Commit the verified implementation without pushing.**

  ```powershell
  git add prototype/mi-dashboard-shadcn/scripts/build-weekly-html.mjs prototype/mi-dashboard-shadcn/scripts/check-weekly-html.mjs prototype/mi-dashboard-shadcn/package.json prototype/mi-dashboard-shadcn/src/App.tsx prototype/mi-dashboard-shadcn/src/components/portal-sidebar.tsx prototype/mi-dashboard-shadcn/scripts/check-production.mjs site/index.html site/MI_Weekly_2026W32.html
  git add -u -- site/assets
  git add -- site/assets/index-*.js site/assets/index-*.css
  git diff --cached --check
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  git commit -m "feat: add Weekly HTML download"
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  git status --short --branch
  ```

  Expected: one clean feature commit; no push is performed.
