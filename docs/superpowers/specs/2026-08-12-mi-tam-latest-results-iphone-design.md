# MI TAM Latest Results (iPhone) — Design Specification

**Status:** User-approved design
**Date:** 2026-08-12

## Objective

Add `Latest Results (iPhone)` directly below `Latest Results` in the `MI TAM`
sidebar. It is a separate hash route and standalone HTML export that shows
agency-level latest results for every production model in `aniModels` (iPhone
15 through iPhone 18). The existing `Latest Results` page, route, fixture, and
interactions must remain unchanged.

## Navigation, shell, and export

- Add the child label `Latest Results (iPhone)` immediately after `Latest Results`.
- Add the page key `latest-results-iphone` and hash `#latest-results-iphone`.
- Add this `PAGE_CONFIG` entry:

  ```json
  "latest-results-iphone": {
    "hash": "#latest-results-iphone",
    "exportFileName": "MI_TAM_Latest_Results_iPhone.html",
    "originalExcelUrl": null
  }
  ```

- Use the existing `DashboardShell`, `PageActions`, hash navigation, and export
  pipeline. `buildAllPageHtml` must produce
  `site/MI_TAM_Latest_Results_iPhone.html`; the standalone page must bootstrap
  the new page key and omit the sidebar and in-page `PageActions` as existing
  exports do.
- Use the existing scrollable-page behavior for this route. The 20-row table
  may make the document taller and must remain vertically scrollable; do not
  clip it in a fixed-height card or introduce horizontal page overflow.
- Header copy is:

  `MI TAM / LATEST RESULTS · IPHONE` → `조사기관별 최신 실적 (iPhone)` →
  `2026 Q1–Q4 Actual · Forecast · iPhone models`

## Shared page structure

Generalize the existing `LatestResultsPage`, `LatestResultsTable`, and
`ForecastHistoryChart` around a dataset/row-key contract. Both pages pass a
dataset configuration into the same page, table, and chart path; do not copy a
second page/table/chart implementation. The shared path must retain the
current vendor page's aggregate rows, defaults, labels, source-link behavior,
and interactions. The iPhone dataset supplies model rows only and has no
aggregate rows.

The two views are identical in meaning to the existing page:

- **Quarter view:** select one of `2026 Q1`, `2026 Q2`, `2026 Q3`, `2026 Q4`;
  render 20 model rows against all six agency columns. The initial quarter is
  `2026 Q1`.
- **Agency view:** select one of the six agencies; render 20 model rows against
  `2026 Q1–Q4` columns. The initial agency is the first agency in the shared
  agency order (`Omdia`).
- View and selector controls are real buttons with `aria-pressed`. Changing a
  view or selector resets the chart selection to the first valid Forecast in
  the new visible table, using the existing row/column scan order.
- The result table remains semantic (`<table>`, column headers, row headers)
  and uses the existing `DESIGN.md` typography, spacing, focus, and surface
  tokens.

## iPhone data contract

The iPhone fixture is deterministic sample data in its own data module. It
imports `aniModels` from `src/data/ani.ts` and never redeclares, sorts, or
filters the model inventory. The exact row order is the exported `aniModels`
order:

```text
iPhone 15 Basic, iPhone 15 Plus, iPhone 15 Pro, iPhone 15 Pro Max,
iPhone 16 Basic, iPhone 16 Plus, iPhone 16 Pro, iPhone 16 Pro Max, iPhone 16e,
iPhone 17 Basic, iPhone 17 Air, iPhone 17 Pro, iPhone 17 Pro Max, iPhone 17e,
iPhone 18 Basic, iPhone 18 Air, iPhone 18 Pro, iPhone 18 Pro Max, iPhone 18e,
iPhone 18 Foldable
```

Each row uses the imported model's `label`, `key`, and `color`. Render the same
series/model color swatch used by ANI beside the model label, with an accessible
text label so color is not the only identifier.

The shared generic shape is:

```ts
type Quarter = "2026 Q1" | "2026 Q2" | "2026 Q3" | "2026 Q4"

type ForecastSnapshot = {
  monthLabel: string
  value: number
}

type ResultCell = {
  actual: number | null
  forecast: number | null
  history: readonly ForecastSnapshot[]
}

type LatestResultsDataset<RowKey extends string> = {
  quarters: readonly Quarter[]
  agencies: readonly {
    key: string
    label: string
    sourceUrl: string | null
    cells: Record<Quarter, Record<RowKey, ResultCell>>
  }[]
  rows: readonly {
    key: RowKey
    label: string
    color?: string
  }[]
}
```

The concrete iPhone dataset uses `AniModelKey` for `RowKey`, the six existing
agency keys and metadata in their existing order (`omdia`, `counterpoint`,
`gfk`, `techinsights`, `tsr`, `trendforce`), all four quarters, and one cell
for every agency × quarter × model combination. Sample values are finite
numbers or `null`; an explicit `0` is a valid value. No database, API, network
fetch, or real source ingestion is part of this fixture.

## Cell semantics and history

Resolve every cell to exactly one display state:

| Data | Display | Interaction |
| --- | --- | --- |
| `actual !== null` | numeric Actual value only | no button, not clickable |
| `actual === null`, `forecast !== null` | numeric value followed by `(F)` | Forecast button, keyboard clickable |
| both `null` | `—` | no button, not clickable |

Actual always wins if both values are supplied. In that case the Forecast value
and history are not exposed and no Forecast button is rendered. Missing values
are never converted to zero. Forecast buttons carry an accessible label that
identifies agency, model, quarter, and value.

Only a Forecast button can update the selected `{ agency, rowKey, quarter }`.
The right card reuses the existing Recharts point `LineChart` and displays the
selected cell's monthly `history` with visible dots, month labels, and an
accessible title/description. Its title includes agency, model, and quarter.
If nothing is selected or the selected history is empty, show the existing
selection/history empty state rather than a fabricated chart. No bar chart or
summary aggregate is added.

## Agency source links and actions

Reuse the six agency source metadata and the current source-link rules in both
views. A valid HTTP(S) `sourceUrl` renders an accessible header link with
`target="_blank"` and `rel="noopener noreferrer"`; a null or invalid URL
renders a disabled/no-link state and never a broken anchor. The iPhone sample
uses the same source-link/no-link mix as the existing fixture. The header uses
the shared `PageActions page="latest-results-iphone"`; its null Excel URL keeps
`원본 엑셀 보기` disabled while `Download as HTML` points to the new export.

## Minimal validation and acceptance

1. The fixture contains exactly the 20 imported `aniModels` in exact order,
   all six agencies, all four quarters, and complete cell dimensions; every
   numeric value and history point is finite.
2. Quarter view renders 20 rows × 6 agency columns; Agency view renders 20 rows
   × 4 quarter columns. No `Total`, `MX`, `Apple`, `CN Total`, or other
   aggregate row appears on the iPhone page.
3. Actual precedence, explicit zero, missing `—`, Forecast `(F)`, and
   Forecast-only clickability are covered by a small data/render check.
4. Model swatches match `aniModels[].color`; source links and no-link states
   match the contract; the chart renders a point Line history after a Forecast
   click.
5. Sidebar order, `#latest-results-iphone`, `PAGE_CONFIG`, shared actions, and
   `MI_TAM_Latest_Results_iPhone.html` are verified. Existing `#latest-results`
   behavior and output remain unchanged.
6. Run the repository's existing test, typecheck, lint, build, and
   `git diff --check` commands; inspect the generated standalone HTML for the
   new page key/hash and absence of sidebar/actions.

## Non-goals

- No database, API, network retrieval, real-data adapter, authentication, or
  source authorization.
- No new chart library, router, dependency, or mobile redesign.
- No filters beyond the two existing view/selector controls.
- No summary, total, regional, or other aggregate rows unless explicitly
  requested later.
- No behavior, fixture, route, export, or visual-regression change to the
  existing `Latest Results` page.

## Self-review

The route key, hash, export filename, page copy, six-agency order, four-quarter
selection, 20-model order, color source, cell precedence, clickability,
source-link behavior, vertical scrolling, reuse boundary, validation checks,
and non-goals are explicit. No unresolved placeholders or open design choices
remain.
