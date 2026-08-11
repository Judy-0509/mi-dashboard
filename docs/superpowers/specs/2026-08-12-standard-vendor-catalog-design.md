# Standard Vendor Catalog — Design Specification

**Status:** Approved design specification
**Date:** 2026-08-12

## Objective

Define one shared vendor dimension for every vendor-dimensional dashboard. The
catalog owns the stable key, display label, canonical order, and color token;
dataset adapters translate provider-native values into that catalog before the
UI renders them.

## Scope

Apply this contract to:

- SigmaIntel Production
- Counterpoint Weekly
- Sell In / Sell Through
- Flagship Sales
- Future datasets that expose a vendor dimension

Apply the contract to vendor rows, chart series, legends, filters, selectors,
and totals on those pages. Do not add vendor controls or vendor rows to ANI
model-series pages, MI TAM aggregate-group pages, or report-only pages that do
not have a vendor dimension.

## Canonical catalog

Every vendor-dimensional view starts with these ten entries, in this exact
order, regardless of provider response order or data availability:

| Position | Stable key | Display label |
| ---: | --- | --- |
| 1 | `apple` | Apple |
| 2 | `samsung` | Samsung |
| 3 | `xiaomi` | Xiaomi |
| 4 | `huawei` | Huawei |
| 5 | `honor` | Honor |
| 6 | `oppo` | OPPO |
| 7 | `vivo` | vivo |
| 8 | `transsion` | Transsion |
| 9 | `lenovo` | Lenovo |
| 10 | `google` | Google |

This order is authoritative for vendor-dimensional pages, even where an
existing page currently uses another order. Color assignments follow the
vendor key, not the entry's position.

Keys are normalized, stable, lowercase identifiers. Provider aliases,
capitalization, spacing, and punctuation are resolved by the dataset adapter;
pages must not contain their own key normalization or vendor order.

Dataset-specific additions, such as `Others`, may follow the ten canonical
entries. Adapters define each addition's stable key and display label and keep
their source-defined order after the canonical catalog. An addition must not
displace, duplicate, or reorder a canonical entry.

The catalog also owns one stable color token per canonical key. Reuse existing
approved vendor colors wherever they exist. Assign colors for newly covered
default vendors from the existing chart palette, record those assignments in
the shared catalog, and reuse them across every dataset; do not redesign the
palette. Dataset additions use their existing semantic color when one exists.

## Data contract

The shared catalog is the only source of truth for canonical vendor metadata.
Each dataset adapter:

1. maps provider-native vendor names to canonical keys or an explicit
   dataset-specific addition;
2. returns one availability state and the dataset payload for every canonical
   key; and
3. returns any declared additions separately, in their appended order.

The adapter output distinguishes `available` from `unavailable`. A provider
value of zero is available when the provider explicitly supplies zero. A
missing, null, malformed, or otherwise unusable provider value is unavailable;
it is never converted to zero.

Availability applies at the smallest value unit the dataset exposes (for
example, a vendor/metric/period point), so one missing point does not invalidate
other supplied points for the same vendor.

UI components iterate the shared catalog first and adapter additions second.
They do not iterate provider rows directly or maintain page-local vendor
arrays. This keeps tables, legends, controls, chart series, and totals aligned
to the same order and metadata.

## Rendering and error semantics

- All ten canonical entries remain visible in vendor-dimensional tables,
  legends, and vendor controls even when a provider has no value for one of
  them.
- An unavailable vendor value renders an em dash (`—`) with an accessible
  status of `데이터 없음`. The status must be available to assistive
  technology without relying on color alone.
- A control for an unavailable vendor is disabled and cannot be selected. An
  unavailable chart series has no segment or point; its corresponding legend
  or status still exposes the em dash and `데이터 없음`.
- Unavailable values are excluded from all totals, denominators, rankings, and
  chart series. They are not fabricated as zero and do not affect axis-domain
  calculations.
- Explicit provider zeros remain numeric zeros and participate in the same
  calculations as other available values.
- An unmapped or conflicting provider vendor is an adapter data error, not a
  new canonical vendor. It must not be silently dropped or assigned a zero;
  the affected value remains unavailable and the page uses its existing
  nonfatal data-error treatment while preserving catalog order.
- A dataset with no usable vendor values keeps the shared catalog visible with
  unavailable states and does not show fabricated totals or charts.

Existing chart/table accessibility, focus, tooltip, and color semantics remain
in force. The catalog standardizes vendor identity and missing-data behavior;
it does not introduce a new page shell or visual redesign.

## Minimal acceptance criteria

1. SigmaIntel Production, Counterpoint Weekly, Sell In / Sell Through,
   Flagship Sales, and any vendor-dimensional future view render the ten
   canonical labels in the exact catalog order.
2. Canonical keys are lowercase and stable, and all provider aliases are
   normalized before UI rendering.
3. Dataset additions such as `Others` appear only after the ten canonical
   entries and never change their order.
4. An unavailable vendor shows `—` and accessible `데이터 없음`, is disabled in
   controls, and contributes to neither totals nor chart series.
5. An explicit provider value of zero remains a real value and is not treated
   as missing.
6. Existing approved colors remain unchanged; newly covered canonical vendors
   receive stable shared color tokens without a palette redesign.
7. ANI model-series, MI TAM aggregate-group, and vendorless report-only pages
   do not gain vendor controls or rows.
