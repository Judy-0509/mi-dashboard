# ANI iPhone Model Production — Design Specification

**Status:** User-approved design; implementation follows this specification
**Scope:** ANI view in `prototype/mi-dashboard-shadcn`
**Source boundary:** ANI uses SigmaIntel Production's visual and layout grammar. Existing SigmaIntel and Counterpoint Weekly behavior remains unchanged.

## Navigation and page copy

- Add a sidebar provider section labeled `ANI`.
- Its child link is labeled `iPhone Model Production` and navigates to `#ani`.
- Use `ani` as the active page key and preserve hash navigation on refresh and browser back/forward.
- The ANI header eyebrow is `ANI / iPhone Model Production`.
- The Korean page title is `iPhone 모델 생산 전망`.
- The subtitle is `2024 Q1–2027 Q2 분기별 Forecast · 단위: Mu`.

The page uses the existing shell, typography, outline controls, bordered no-shadow card, card-header divider, tooltip, and chart spacing used by SigmaIntel Production. Keep the Sigma implementation local; do not extract or refactor a shared Sigma/ANI component in this change.

## Data contract

Use one deterministic synthetic quarterly dataset covering 14 quarters, `2024 Q1` through `2027 Q2`. Each quarter contains one value for every model below; values are model production quantities in `Mu`, with the quarterly total equal to the sum of its visible model segments. Phase-ins and phase-outs may be represented with zero values, but the dataset must stay deterministic and must not introduce vendor fields.

| Generation | Model inventory |
| --- | --- |
| iPhone 15 | Basic, Plus, Pro, Pro Max |
| iPhone 16 | Basic, Plus, Pro, Pro Max, e |
| iPhone 17 | Basic, Air, Pro, Pro Max, e |
| iPhone 18 | Basic, Air, Pro, Pro Max, e, Foldable |

The canonical type filters are `Basic`, `Plus / Air`, `Pro`, `Pro Max`, `e`, and `Foldable`. `Plus / Air` maps to iPhone 15/16 Plus and iPhone 17/18 Air. `e` is available for iPhone 16, 17, and 18; `Foldable` is available only for iPhone 18.

## Layout and chart behavior

The main production card follows SigmaIntel's two-column composition: a shrinkable 58:42 chart-to-history split with a vertical divider and the existing inter-column spacing. The left plot is a quarterly stacked bar chart from `2024 Q1` to `2027 Q2`.

- Each active model is a stack segment, in generation/model order.
- Segment labels show the value in `Mu`; a total label appears above each bar.
- The chart tooltip lists the quarter, model name, and segment value.
- Clicking a quarter selects it, visibly updates the selected state, and refreshes the right-hand history panel.
- The initial selected quarter is the latest ANI quarter (`2027 Q2`); ANI does not depend on Sigma's focus-quarter state.

The right panel is titled `{selectedQuarter} 전망 변화` and contains six monthly stacked bars for that selected quarter. It uses the same active model filter and color mapping as the left chart. It has no vendor delta list or vendor legend. Beside the plot, show only these three summaries:

1. `현재 Forecast`: latest monthly total.
2. `전월 대비`: latest month total minus the previous month total, signed in `Mu`.
3. `6개월 대비`: latest month total minus the first month total, signed in `Mu`.

The six monthly observations are deterministic synthetic forecast revisions ending at the selected quarter. Positive and negative summary deltas retain the existing primary/destructive/muted treatment used by SigmaIntel.

## Filters and color system

Place two independent multi-select filter groups above the charts:

- `시리즈`: iPhone 15, iPhone 16, iPhone 17, iPhone 18
- `모델 유형`: Basic, Plus / Air, Pro, Pro Max, e, Foldable

All options are active initially. A model is visible only when both its generation and type are active; the two groups therefore use intersection semantics. Keep at least one active option in each group, and provide a `필터 초기화` control that restores all options. The visible-model count and both charts update together.

Colors must make generation and model tier legible without relying on labels alone:

- Each generation has one base hue family.
- Basic and Plus / Air use light tones of that generation hue.
- Pro and Pro Max use dark tones of the same generation hue.
- `e` uses a separate dedicated hue family, distinct from Basic and Plus / Air.
- `Foldable` uses another dedicated hue family, distinct from both generation hues and `e`.

Use the same swatch mapping in filter controls, chart segments, and tooltips. Keep the existing text labels and focus/selected-state treatment so color is never the sole state indicator.

## Density and accessibility rules

Inline segment labels are shown only when the rendered segment is at least 24 px wide; labels hidden by this rule remain available in the chart tooltip and accessible chart data. Total labels remain visible. This rule applies to both quarterly and monthly charts and prevents crowded labels without losing values.

Filters are keyboard reachable multi-select controls with pressed/selected state, visible focus, and text labels. Charts retain the existing accessibility layer and tooltip. The page must not create horizontal scrolling at the existing desktop reference viewport; chart wrappers and card children remain shrinkable.

## Explicit non-goals

- Do not alter SigmaIntel Production's current vendor view or Counterpoint Weekly's behavior.
- Do not add vendor production fields, vendor-by-vendor deltas, or a vendor legend to ANI.
- Do not refactor SigmaIntel into a shared chart/page abstraction.
- Do not add network retrieval, new dependencies, export behavior, or a separate mobile redesign.

## Verification and acceptance criteria

The implementation is accepted when all of the following are true:

1. The sidebar shows `ANI` with the `iPhone Model Production` child link, and `#ani` selects the ANI page through refresh and hash navigation.
2. The ANI header uses the exact source, title, and subtitle copy specified above and follows SigmaIntel's visual grammar.
3. The dataset contains 14 quarterly rows from `2024 Q1` through `2027 Q2` and exactly the approved 20-model inventory, with no vendor dimension.
4. Both filter groups support multi-select, preserve at least one active option, and render the intersection of generation and model type; `Plus / Air`, `e`, and `Foldable` map as specified.
5. Generation tiers use the required light/dark hue rules, while `e` and `Foldable` each use a distinct hue family consistently across controls, charts, and tooltips.
6. The left chart is a clickable quarterly stacked model-production chart with segment values, totals, and tooltips.
7. Clicking a quarter updates the right panel to six monthly stacked forecast-history bars for that quarter and preserves the active filters.
8. The right panel shows only current total, month-over-month delta, and six-month delta; no vendor delta list or vendor legend appears.
9. Small segments hide only their inline labels, while their values remain in tooltips and accessible chart data; no horizontal overflow appears at the reference desktop viewport.
10. Existing tests pass, `npm run build` passes, and the final result is handed to the user for visual review before any further visual refinement.

## Task 3 visual encoding addendum (approved 2026-08-11)

This addendum supersedes the earlier standalone `e`/`Foldable` hue and 24 px density guidance where it conflicts below. Generation color communicates the iPhone family; SVG pattern communicates special type; annotation communicates first-ever introduction.

- `iphone16E` shares the iPhone 16 family color with `iphone16Plus`; `iphone17E` shares iPhone 17 with `iphone17Air`; `iphone18E` shares iPhone 18 with `iphone18Air`; and `iphone18Foldable` shares iPhone 18 with `iphone18ProMax`.
- In both quarterly and history charts, `e` uses a generation-colored diagonal hatch and `Foldable` uses a generation-colored dot pattern. Chart-specific pattern ID prefixes prevent collisions; ordinary models remain solid. The legend shows generation-family swatches and pattern samples, without separate green/rose hue semantics.
- The selected quarter keeps the existing `selectedQuarter 선택됨` text and uses a primary-colored X-axis label with a 2 px underline. Quarterly bar cells do not use a selected-quarter stroke or outline. The custom tick is accessible and renders ordinary quarters normally.
- The quarterly chart alone shows subtle vertical dashed `NEW · e` at `2025 Q2` and `NEW · Foldable` at `2027 Q1`; each marker is conditional on the corresponding first-introduction model being visible under the active type and generation/lineup filters. Later `e` introductions are not annotated.
- Inline labels use the approved readable 12 px minimum rendered vertical segment height; totals remain visible at the actual topmost nonzero visible segment.
