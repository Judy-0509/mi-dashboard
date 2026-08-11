# Collapsible Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the portal's left navigation toggle between its existing 256px sidebar and a 40px rail that leaves only an accessible expand button.

**Architecture:** Keep one local `collapsed` boolean inside `PortalSidebar`; no parent or routing contract changes. Reuse the installed `Button` and `lucide-react` icons, conditionally render all sidebar content, and let the existing flex shell give freed width to the page body.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, existing shadcn `Button`, `lucide-react`, Node assertion harness, Vite.

## Global Constraints

- Expanded width remains exactly `256px` (`w-64`); collapsed width is exactly `40px` (`w-10`).
- The collapsed rail shows only one centered expand button; brand, separator, nav, links, and duplicate focus targets are not rendered.
- Default and every refresh start expanded; do not add `localStorage`, context, or another state library.
- Preserve every existing provider, active route, hash, back/forward behavior, and `PortalSidebarProps` signature.
- Reuse the existing `Button` plus `PanelLeftClose` / `PanelLeftOpen` from the already-installed `lucide-react` package.
- Apply only a subtle width transition; do not add provider icons, tooltips, mobile behavior, responsive redesign, dependencies, or layout abstractions.
- Keep standalone HTML exports unchanged and sidebar-free; do not modify page config, routing, export registry, or export builder behavior.
- The toggle must expose synchronized `aria-expanded` and Korean labels `네비게이션바 접기` / `네비게이션바 펼치기`, retain native keyboard activation, and retain visible focus.

---

### Task 1: Add the accessible collapsible sidebar and verify the built portal

**Files:**
- Modify: `prototype/mi-dashboard-shadcn/scripts/check-production.mjs` — source-contract assertions for the toggle and unchanged navigation/export boundaries.
- Modify: `prototype/mi-dashboard-shadcn/src/components/portal-sidebar.tsx` — local state, toggle control, conditional content, and width transition.
- Regenerate: `site/` — committed production output created by the existing build command.

**Interfaces:**
- Consumes: existing `PortalSidebarProps = { activePage: PortalPage; onNavigate: (page: PortalPage) => void }`, `Button`, `PanelLeftClose`, and `PanelLeftOpen`.
- Produces: the same `PortalSidebar(props): JSX.Element` public contract; internal `const [collapsed, setCollapsed] = useState(false)` only.

- [ ] **Step 1: Add failing source-contract checks**

  In the existing `sidebarSource` assertion block in `scripts/check-production.mjs`, add exact assertions that require the implementation and protect scope:

  ```js
  assert.match(sidebarSource, /useState\(false\)/)
  assert.match(sidebarSource, /collapsed \? "w-10" : "w-64"/)
  assert.match(sidebarSource, /transition-\[width\]/)
  assert.match(sidebarSource, /aria-expanded={!collapsed}/)
  assert.match(
    sidebarSource,
    /collapsed \? "네비게이션바 펼치기" : "네비게이션바 접기"/
  )
  assert.match(sidebarSource, /collapsed \? <PanelLeftOpen/)
  assert.match(sidebarSource, /: <PanelLeftClose/)
  assert.match(sidebarSource, /{!collapsed && \(/)
  assert.doesNotMatch(sidebarSource, /localStorage|sessionStorage/)
  ```
  Keep all current sidebar provider/hash assertions unchanged so the same test also guards navigation.

- [ ] **Step 2: Run the focused test and confirm RED**

  Run from `prototype/mi-dashboard-shadcn`:

  ```powershell
  npm.cmd test
  ```
  Expected: FAIL at the first new `sidebarSource` assertion because `PortalSidebar` does not yet call `useState(false)`.

- [ ] **Step 3: Implement the minimum local-state toggle**

  Update only `portal-sidebar.tsx`:

  ```tsx
  import { useState } from "react"
  import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
  import { Button } from "@/components/ui/button"
  import { Separator } from "@/components/ui/separator"
  ```
  Inside `PortalSidebar`, before `return`, add:

  ```tsx
  const [collapsed, setCollapsed] = useState(false)
  ```
  Replace the fixed aside classes with the state-driven width while preserving the existing colors, border, and flex behavior:

  ```tsx
  <aside className={`relative flex shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-150 ${collapsed ? "w-10" : "w-64"}`}>
  ```

  Render the toggle first so it remains available in both states:

  ```tsx
  <div className={collapsed ? "flex justify-center pt-5" : "absolute top-5 right-3"}>
    <Button
      aria-expanded={!collapsed}
      aria-label={collapsed ? "네비게이션바 펼치기" : "네비게이션바 접기"}
      onPress={() => setCollapsed((value) => !value)}
      size="icon-sm"
      variant="ghost"
    >
      {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
    </Button>
  </div>
  ```

  Immediately after the toggle, render the existing content with this exact conditional and wrapper class. This preserves its original `px-5 py-7` placement and removes every menu focus target when collapsed:

  ```tsx
  {!collapsed && (
    <div className="px-5 py-7">
      <div>
        <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
          MI Intelligence
        </p>
        <p className="mt-1.5 text-lg font-semibold tracking-tight">Portal</p>
      </div>
      <Separator className="my-7 bg-sidebar-border" />
      <nav aria-label="Research portals" className="space-y-6">
        {providers.map(({ label, children }) => (
          <section key={label}>
            <h2 className="text-base leading-6 font-bold">{label}</h2>
            {children.map(({ child, page, href }) => {
              const active = activePage === page
              return (
                <a
                  aria-current={active ? "page" : undefined}
                  className={`ms-3 mt-1.5 block px-3 py-2 text-sm leading-5 ${
                    active
                      ? "bg-sidebar-primary font-medium text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  }`}
                  href={href}
                  key={page}
                  onClick={() => onNavigate(page)}
                >
                  {child}
                </a>
              )
            })}
          </section>
        ))}
      </nav>
    </div>
  )}
  ```
  Do not change the provider map, links, `href`, `aria-current`, or `onNavigate` code.

- [ ] **Step 4: Run GREEN checks and inspect the surgical diff**

  From `prototype/mi-dashboard-shadcn`, run:

  ```powershell
  npm.cmd test
  npm.cmd run typecheck
  npm.cmd run lint
  git diff --check
  ```

  Expected: all commands exit `0`; `npm.cmd test` ends with `production and weekly data checks passed`; the diff contains only the sidebar and its assertions before build output is generated.

- [ ] **Step 5: Build committed static output**

  Run:

  ```powershell
  npm.cmd run build
  node scripts\check-weekly-html.mjs
  $site = (Resolve-Path '..\..\site').Path
  $index = Get-Content -Raw -Encoding UTF8 (Join-Path $site 'index.html'); $assetRefs = [regex]::Matches($index, 'assets/index-[^"'']+\.(?:js|css)') | ForEach-Object Value | Sort-Object -Unique
  if ($assetRefs.Count -ne 2) { throw "Expected one hashed JS/CSS pair" }; $assetRefs | ForEach-Object { if (-not (Test-Path (Join-Path $site $_))) { throw "Missing asset: $_" } }
  $exports = Get-ChildItem $site -Filter 'MI_*.html'; if ($exports.Count -ne 8) { throw "Expected 8 standalone exports" }
  $exports | ForEach-Object { $html = Get-Content -Raw -Encoding UTF8 $_.FullName; if ($html -notmatch 'window\.__MI_EXPORT_PAGE__' -or $html -match '<aside\b|PageActions|<script[^>]+\bsrc=|<link[^>]+rel=["'']stylesheet') { throw "Invalid standalone export: $($_.Name)" } }
  git diff --check
  ```

  Expected: TypeScript/Vite and the fixture check succeed; the following commands directly read committed `site/index.html` and all eight `site/MI_*.html`, prove both referenced hashed assets exist, and reject exports containing sidebar/action markup or external asset tags. Vite replaces the old `site/assets/index-*.js` and `site/assets/index-*.css` hashes with one new JS/CSS pair; `site/index.html` and every `site/MI_*.html` are rebuilt, while `site/mi-mark.svg` and font files remain unchanged.

- [ ] **Step 6: Verify the real desktop interaction once at 1440px**

  From the repository root, start the built portal in a separate PowerShell window:

  ```powershell
  py -3 scripts\serve_dashboard.py --host 127.0.0.1 --port 8000
  ```

  Open `http://127.0.0.1:8000/#pipeline-check` and set the browser viewport to `1440px` wide. In DevTools Console, capture the exact DOM elements and expanded main width:

  ```js
  const sidebar = document.querySelector("aside")
  const main = document.querySelector("main")
  const collapseButton = sidebar.querySelector('button[aria-label="네비게이션바 접기"]')
  console.assert(Math.round(sidebar.getBoundingClientRect().width) === 256)
  console.assert(collapseButton.getAttribute("aria-expanded") === "true")
  const expandedMainWidth = main.getBoundingClientRect().width
  collapseButton.click()
  await new Promise((resolve) => setTimeout(resolve, 200))
  const expandButton = sidebar.querySelector('button[aria-label="네비게이션바 펼치기"]')
  console.assert(Math.round(sidebar.getBoundingClientRect().width) === 40)
  console.assert(main.getBoundingClientRect().width > expandedMainWidth)
  console.assert(expandButton.getAttribute("aria-expanded") === "false")
  console.assert(sidebar.querySelectorAll("nav, a, h2, [role=separator]").length === 0)
  console.assert(document.documentElement.scrollWidth === document.documentElement.clientWidth)
  ```

  Then verify the keyboard and route behavior in one pass:

  1. First move focus away with `main.querySelector("a, button, [tabindex='0']").focus()`, then press Shift+Tab until `document.activeElement === expandButton`; visually confirm the focus ring and run `const s = getComputedStyle(expandButton); console.assert(s.boxShadow !== "none" || parseFloat(s.outlineWidth) > 0)`.
  2. Press Enter, collapse again, and press Space; each activation must restore `256px` and the Korean collapse label without mouse input.
  3. Click `Counterpoint > Weekly`, then use browser back/forward; active styling and hash navigation remain correct.
  4. Refresh: `Math.round(document.querySelector("aside").getBoundingClientRect().width) === 256` and the collapse label is restored.

- [ ] **Step 7: Review scope and commit**

  Run from the repository root:

  ```powershell
  git status --short
  git diff --stat
  git diff --check
  git add prototype/mi-dashboard-shadcn/src/components/portal-sidebar.tsx prototype/mi-dashboard-shadcn/scripts/check-production.mjs site
  git commit -m "feat: add collapsible portal sidebar"
  ```

  Expected: no app/router/page-config/export source changes, no storage or dependency changes, no temporary implementation markers or intentionally skipped/focused tests, and one commit containing the implementation, its runnable check, and regenerated `site/` output. Preserve unrelated untracked `.superpowers/` content and do not push.
