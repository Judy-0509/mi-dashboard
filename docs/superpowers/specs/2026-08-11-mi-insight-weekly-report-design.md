# MI Insight Weekly Report Design

**Status:** Approved design; implementation pending
**Date:** 2026-08-11

## Approved UI

- Add an `MI Insight` provider group with one child, `Weekly Report`.
- Use route key `mi-insight` and hash `#mi-insight`; place the group after Counterpoint and before ANI.
- Preserve the existing shell, sidebar, typography, spacing, card, border, and button grammar.
- The page order is: shared page header → `Executive Summary` → one report-table card.
- The header uses the shared `PageActions` component. The original Excel action stays disabled until its configured URL is available; `Download as HTML` remains available.
- The summary contains 1–3 bullet insights. Do not show a `MOCK` or sample-data label.
- The report table is semantic, vertically scrollable for long lists, and has no horizontal scrolling or extra controls.

## Report table

Columns appear in this exact order:

`파일명` · `조사기관` · `응용처` · `주기` · `업로드일자` · `공유내용` · `파일 EDM 링크`

- `업로드일자` is stored as `YYYY-MM-DD` and rows are always rendered newest first. There is no user-controlled sort.
- `공유내용` displays no more than two visible lines.
- A present EDM URL displays an external-link icon and `원본 보기`; `edmUrl: null` displays plain, non-clickable `원본 링크 없음`.
- Use a semantic table with a caption, column headers, and `scope="col"`. Links retain visible keyboard focus.

## Sample data contract

Keep seed data in `src/data/mi-insight.ts`, separate from the page component, so production values can replace the module directly.

```ts
export type MiInsightReport = {
  fileName: string
  researchProvider: string
  useCase: string
  cadence: string
  uploadDate: string // YYYY-MM-DD
  sharedContent: string
  edmUrl: string | null
}

export const miInsightInsights: readonly string[] // 1–3 entries
export const miInsightReports: readonly MiInsightReport[]
```

The initial rows are representative smartphone-market research entries. The page only renders supplied data; it does not fetch or parse EDM.

## Page-specific export

- Add `MI_Insight_Weekly_Report.html` to the existing page export configuration.
- Reuse the current self-contained HTML packager; do not create a second exporter or duplicate report markup.
- The exported file opens directly on `#mi-insight`, includes the same bundled data and table order, and has no sidebar or `PageActions`.
- The export contains no network-loaded application assets.

## Minimal acceptance checks

1. Sidebar navigation and direct `#mi-insight` navigation open the MI Insight Weekly Report page and mark it active.
2. The live page shows 1–3 insights, all seven columns, latest-first rows, two-line shared content, and the EDM icon/text link treatment.
3. The original Excel action is disabled, while the HTML action targets `MI_Insight_Weekly_Report.html`.
4. The generated HTML opens standalone, contains no sidebar/actions, and renders the same page content.
5. Existing SigmaIntel, Counterpoint, and ANI pages retain their current behavior.

## Explicit non-goals

- EDM authentication, network validation, download, or automatic file ingestion.
- Excel/SQLite/JSON pipeline changes, upload, editing, CRUD, or report management.
- Search, filtering, pagination, infinite scroll, or interactive sorting.
- Detail pages, modals, charts, KPI cards, annotations, or additional insight views.
- Mobile redesign, shell redesign, new dependencies, generic table abstractions, or changes to other providers.
