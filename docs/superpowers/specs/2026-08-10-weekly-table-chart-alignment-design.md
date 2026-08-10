# Weekly table/chart vertical alignment

**Status:** Approved design specification  
**Reference viewport:** Desktop 1440 × 900 px only

## Objective

Align the bottom of the existing left `Vendor × Region` table with the bottom
of the existing right Weekly cumulative plot, within 1 px at the reference
viewport. The change is a vertical redistribution of space already present
below the table; it is not a page or card resize.

## Constraints

- Keep current cards, section order, page bottom, and all existing content
  exactly as-is; do not extend content downward.
- Keep the right cumulative chart's height and geometry unchanged.
- Do not change data, aggregation, interactions, chart math, card widths,
  headers, or mobile behavior.
- Reallocate only the blank vertical space below the left table into its
  existing header/body row heights until the table bottom matches the current
  right plot bottom within 1 px.
- Change only the Weekly right legend typography to match Sigma Forecast
  History exactly: `text-sm` (14 px), `leading-5` (20 px), and a 6 px color
  marker. Preserve the legend's current content, order, placement, and
  behavior.
- Add no dependencies, abstractions, data fields, or new responsive rules.

## Implementation shape

Use the existing Weekly table/chart elements and styles. Measure the current
right plot bottom at 1440 × 900, then distribute the already available blank
space across the left table's existing header/body row sizing. Keep the plot's
computed height, card widths, and surrounding section geometry fixed. Reuse
the Sigma Forecast History legend classes/tokens for the Weekly legend's text,
line height, and marker size; do not create a shared component.

## Acceptance checks

1. At 1440 × 900, the left table bottom and current right plot bottom differ
   by no more than 1 px.
2. The page bottom and all existing card/section boundaries are unchanged;
   no new downward content or horizontal overflow appears.
3. The right plot's height and geometry are unchanged, and its data, chart
   math, controls, headers, card widths, and interactions still match before.
4. The Weekly right legend uses 14 px text, 20 px line height, and a 6 px
   marker, matching Sigma Forecast History; content/order/behavior are intact.
5. Mobile rendering is unchanged. No console errors or test regressions occur.

## Minimal TDD approach

1. Add or update one focused browser/layout assertion for the 1440 × 900
   bottom-coordinate delta and legend computed typography.
2. Run it against the current implementation to capture the failing alignment
   assertion, then make the smallest CSS/layout change.
3. Re-run the focused check, existing tests, and a 1440 × 900 Weekly smoke
   check; verify the diff contains only the intended styling changes.
