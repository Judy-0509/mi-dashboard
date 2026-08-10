# Counterpoint Weekly Visual Grammar Refinement

**Status:** Conceptual design approved, written specification pending user review
**Scope:** Counterpoint Weekly desktop UI only
**Reference viewport:** 1440 x 900 px

## Authority and intent

This focused specification governs the Counterpoint Weekly refinement. `DESIGN.md` is a legacy cumulative-chart reference; use this document when its Weekly guidance differs.

The goal is visual consistency with SigmaIntel, not a shared chart system or a common report layout. Weekly keeps its present reporting structure and chart semantics. Sigma supplies only the visual grammar: header hierarchy, card treatment, typography, shadcn control treatment, tooltip behavior, and selected-state clarity.

## In-scope surface and components

Only these existing components participate in the refinement:

| Component | Required change or retained responsibility |
| --- | --- |
| `src/App.tsx`, `WeeklyPage` | Keep the shared page-header structure. Change only the right-side metadata copy to `기준: 2026 W32 · 단위: Mu`. |
| `src/components/weekly-executive-summary.tsx` | Retain the existing `Executive Summary` card, bullet content, and Sigma-matching summary treatment. No new summary logic. |
| `src/components/weekly-analysis.tsx` | Apply the 58:42 analysis-row layout, Sigma card-title hierarchy, and the cumulative-chart legend placement. Retain the heatmap, selectors, `BarChart`, and existing tooltip. |
| `src/data/weekly.ts` | Retain all current mock-data constants, aggregation functions, labels, segment ordering, colors, and derived values. No data change. |
| Existing shadcn `Card`, `ToggleGroup`, and chart tooltip primitives | Reuse as-is. Do not introduce a shared Weekly/Sigma abstraction. |

## Desktop layout

The Weekly page order remains:

1. Shared Weekly page header.
2. Existing Executive Summary card.
3. One two-column analysis row: heatmap on the left, cumulative composition on the right.

At 1440 x 900 px, the analysis row uses `minmax(0, 58fr) minmax(0, 42fr)`, with the existing 16 px inter-card gap. The heatmap receives 58% and the cumulative composition card 42% of the width remaining after that gap. The direct Card grid items receive `min-w-0`; the cumulative plot wrapper is also shrinkable with `min-w-0`, so neither the cards nor the nested plot can create horizontal scrolling.

The application continues to use the shared desktop shell and its 1180 px minimum application width. Weekly is vertically scrollable; it must not create page-level, card-level, table-level, or chart-level horizontal scrolling at the reference viewport.

## Page header and card grammar

The Weekly header retains the existing left-side source label, title, and description. Its right-side monospace metadata is exactly:

```text
기준: 2026 W32 · 단위: Mu
```

Both Weekly analysis cards continue to use the existing small shadcn card treatment: `size="sm"`, border, no shadow, and a bottom border on the header. Do not add colored card accents, nested cards, new container types, or decorative motion.

Each analysis-card header follows SigmaIntel's hierarchy:

1. A muted, uppercase, 12 px source/context label with the existing tracking treatment.
2. A `CardTitle` 20 px (`text-xl`), semibold, tight-tracking report title, separated from the context label by the existing 4 px top margin.
3. Use a 14 px muted subtitle only when it conveys existing content. Do not invent explanatory copy merely to make both cards match.

For the present cards, keep these labels and titles:

| Card | Context label | Card title |
| --- | --- | --- |
| Heatmap | `Weekly market mix` | `Vendor × Region` |
| Cumulative composition | `Cumulative sell-out` | `4-year cumulative composition` |

The YoY/WoW control stays right-aligned in the heatmap header. The region selector stays in the cumulative-card header below its title. Controls retain the existing outline ToggleGroup vocabulary and are not moved into a shared filter bar.

## Heatmap behavior

The left card remains a Vendor × Region table. It continues to show the existing rows and columns and switches only between the existing YoY and WoW derived values. The selected metric continues to control `getWeeklyHeatmap(metric)`.

Negative percentages remain destructive red. Zero, positive, and unavailable values retain their existing foreground or muted treatment. There is no new heatmap color scale, selectable cell behavior, drill-down, sorting, or filtering.

## Cumulative composition behavior

The right card remains a four-bar stacked cumulative `BarChart`. It continues to derive `chartData` from `getWeeklyCumulative(region)` and uses the existing region-dependent meaning:

| Selected context | Stack segments |
| --- | --- |
| `Total` | USA, China, Japan, Europe, India |
| USA, China, Japan, Europe, or India | Apple, Samsung, Xiaomi, OPPO, vivo, Honor, Others |

Keep the current four years, stack order, totals, internal segment labels, colors, tooltip, no-animation setting, X-axis year labels, and region selector behavior. This view remains a cumulative composition comparison, not a trend chart. Do not add a line chart, an alternate cumulative calculation, new filters, or click-to-select bars.

Hide the cumulative chart's Y-axis completely, including axis line, ticks, and numeric `Mu` labels. The existing horizontal grid lines may remain because they help compare bar height without adding numeric scale clutter.

Replace the current chart-bottom wrapping legend with a right-side vertical legend in the cumulative-card content. The content area uses a two-column grid: a shrinkable chart plot and a fixed 140 px legend column, matching the Sigma forecast-history information density. Render the legend as a semantic `<ul>` or equivalent list, with one list item per active `cumulative.years[0].segments` entry in stack order. Each item contains the existing decorative color swatch followed by the segment name. It is informational, not a filter or button.

## State, tooltip, and accessibility requirements

- The existing `YoY` and `WoW` ToggleGroup selection is retained. Exactly one metric is selected at a time, and changing it refreshes only the heatmap values.
- The existing Total/region ToggleGroup selection is retained. Exactly one context is selected at a time, and changing it refreshes the cumulative stacks, total labels, and right-side legend together.
- Toggle buttons retain their accessible group labels, selected styling, keyboard operation, and visible focus state from the existing shadcn primitives.
- The cumulative `BarChart` retains `accessibilityLayer` and the existing chart tooltip. Tooltip behavior, value formatting, and hover behavior are not redesigned. The heatmap remains a semantic table, not an accessibility-layer chart.
- The heatmap remains a semantic table with row and column headers. The cumulative legend has an accessible label that describes it as the cumulative-composition legend, while its swatches remain decorative.
- Preserve the current text contrast, `tabular-nums` numeric treatment, and destructive color for negative values. Do not convey a state solely by color.

## Data flow and error handling

No data-path change is part of this work:

```text
weekly.ts mock data and getters
  -> WeeklyAnalysis local metric and region state
  -> heatmap table and cumulative BarChart / tooltip / legend
```

`weeklySelectedWeek`, `weeklyYears`, `weeklyRegions`, `weeklyVendors`, `getWeeklyHeatmap`, and `getWeeklyCumulative` remain unchanged. The `WeeklyExecutiveSummary` continues to receive its precomputed copy from `weeklyExecutiveSummary` without being coupled to either local selector.

There is no existing component error boundary, loading state, or empty-data state for this static UI preview. Do not add one in this visual-only change. Preserve the application's existing error behavior and do not mask chart or data errors with fallback content.

## Acceptance criteria

1. At 1440 x 900 px on `#weekly`, the page presents the existing shared shell, Weekly header, Executive Summary, and analysis row. Vertical scrolling is permitted; no horizontal scrollbar is present anywhere in the page, heatmap, or cumulative card.
2. The analysis row has a 58:42 heatmap-to-cumulative column allocation after its 16 px gap. The direct Card grid items and nested cumulative plot are shrinkable, and the heatmap is visibly wider than the cumulative chart without changing their domain content.
3. The Weekly header's right-side text is exactly `기준: 2026 W32 · 단위: Mu`.
4. Each analysis card has the existing source/context label and a 20 px semibold card title using the same hierarchy as SigmaIntel. The labels and titles match the table in this specification.
5. The YoY/WoW selector still changes the heatmap between the existing `getWeeklyHeatmap("yoy")` and `getWeeklyHeatmap("wow")` results. No other view changes.
6. The Total/region selector still changes the cumulative chart from region stacks to vendor stacks as defined above. The right-side legend updates to the same active segment list and order as the stacks.
7. The cumulative chart has no visible Y-axis line, Y-axis tick, or Y-axis numeric label. It retains its X-axis years, stacked bars, segment labels, total labels, grid lines, and existing tooltip.
8. The cumulative legend is a semantic list, vertical, placed to the right of the plot in a 140 px column, and is not rendered below the chart or made interactive.
9. Keyboard focus reaches every toggle option, the selected option remains announced and visually distinct, and the cumulative `BarChart` retains its tooltip and accessibility layer while the heatmap remains a semantic table.
10. A browser smoke check at 1440 x 900 px on `#weekly` confirms the acceptance criteria above and reports no console errors.
11. The implementation adds no dependency, shared chart component, new data field, data calculation, line chart, responsive mobile design, error boundary, or loading state.

## Explicit non-goals

- Rebuilding Weekly to mirror SigmaIntel's production-versus-forecast layout.
- Extracting a shared chart component, shared page template, shared filter bar, or new design-system token.
- Changing data source, mock-data values, query behavior, aggregation logic, or source labels.
- Changing Weekly chart type, adding forecast history, trend lines, drill-down, export, sorting, cross-filtering, or bar selection.
- Redesigning the shared shell, sidebar, Executive Summary content, shadcn primitives, tooltip component, or SigmaIntel page.
- Adding mobile or tablet responsive behavior beyond preventing horizontal overflow at the stated desktop viewport.
