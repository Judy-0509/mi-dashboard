# Weekly Single-HTML Download Design

## Decision

Generate `MI_Weekly_2026W32.html` at build time from the Vite production output. The dated filename reflects the current W32 build/as-of period and must be updated together with the Weekly as-of period when that period changes. The generated file is a self-contained, offline Weekly dashboard and is refreshed by the normal build/GitHub Actions flow.

## Live dashboard behavior

- Show an accessible `Download as HTML` button only in the live Counterpoint Weekly header.
- Do not add the button to SigmaIntel.
- Use a descriptive button name and keyboard-focusable native button behavior.
- The button downloads the current build artifact with the fixed filename `MI_Weekly_2026W32.html`.

## Exported file behavior

- Open directly from `file://` without a web server, network, or external request.
- Start in Weekly-only mode; remove SigmaIntel navigation and routes from the exported view.
- Retain Counterpoint/Weekly branding.
- Retain all existing Weekly interactions and state changes: YoY/WoW, region, vendor, Mu/M/S, charts, and tooltips.
- Hide the export button inside the exported file to avoid recursively exporting an export.
- Inline the complete application JavaScript, CSS, bundled data, DM Sans font assets, and favicon.

## Build implementation

Run a small no-dependency packager immediately after the Vite output is produced. It must:

1. Read the expected Vite HTML, JavaScript, CSS, font, and favicon assets.
2. Replace local asset references with safely escaped inline contents.
3. Embed the Weekly-only bootstrap/state required to open the exported view directly.
4. Write `MI_Weekly_2026W32.html` beside the production output.

The packager must safely escape closing `</script>` and `</style>` sequences before embedding text. It must fail the build when an expected asset is missing, when an asset cannot be read, or when the resulting HTML still contains network-loading `script src`, stylesheet `link`, favicon `href`, or non-`data:` font `url()` references. Harmless namespace and license URL strings are allowed. No new dependency is required.

## Verification

- Add unit/static packager assertions for asset discovery, inline replacement, sequence escaping, Weekly-only bootstrap, hidden export button, filename, and external-reference rejection.
- Run the existing test suite, lint, typecheck, and production build.
- Scan the generated HTML to confirm JavaScript, CSS, data, fonts, and favicon are embedded and no network-loading script, stylesheet, favicon, or font references remain.
- Run browser QA by opening the generated file with `file://`; exercise region, vendor, YoY/WoW, Mu/M/S, chart selection, and tooltip interactions.
- Regression-check the normal live SigmaIntel and Weekly routes, including the live download button and absence of the button on SigmaIntel.

## Data boundary

The export packages the dashboard's current bundled mock data only. It does not expose or fetch internal Excel/DB sources; future data refreshes must update the bundle before the build/export step.

## Rejected alternatives

- Runtime browser assembly: rejected because it is less deterministic across browsers and can be affected by download/security policies.
- ZIP export: rejected because the requirement is one directly openable HTML file.
