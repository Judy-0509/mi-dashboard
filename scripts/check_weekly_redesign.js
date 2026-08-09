const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const bridge = read("site/assets/weekly-redesign.js");
const bundle = read("site/assets/index-DdGOxX2Y.js");
const css = read("site/assets/portal-overrides.css");
const html = read("site/index.html");

for (const hook of ["cp-report-main", "cp-weekly", "cp-matrix", "Production Forecast"]) {
  assert.ok(bundle.includes(hook), `missing bundle hook: ${hook}`);
}

assert.match(bridge, /WEEKLY_YEARS = \[2023, 2024, 2025, 2026\]/);
assert.match(bridge, /WEEKLY_SELECTED_WEEK = 32/);
assert.match(bridge, /const weekEnd = WEEKLY_SELECTED_WEEK;/);
assert.doesNotMatch(bridge, /weekEnd = year === 2026 \? WEEKLY_SELECTED_WEEK : 52/);
assert.match(bridge, /WEEKLY_REGIONS/);
assert.match(bridge, /originalWeeklyUnits/);
assert.match(bridge, /WEEKLY_CURRENT_FACTOR/);
assert.match(bridge, /weekly-heatmap-metric/);
assert.match(bridge, /function buildWeeklyData/);
assert.match(bridge, /function buildHeatmap/);
assert.match(bridge, /function buildCumulative/);
assert.match(bridge, /tone: region === "Total" \? WEEKLY_REGION_TONES\[name\] : "dark"/);
assert.match(bridge, /function buildWeeklyCopy/);
assert.match(bridge, /weekly-cumulative-svg/);
assert.doesNotMatch(bridge, /weekly-cumulative-axis-label/);
assert.match(bridge, /weeklyContext/);
assert.match(bridge, /확인 필요/);
assert.doesNotMatch(bridge, /입니다|습니다/);
assert.match(bridge, /cumulative = Object\.fromEntries/);
assert.match(bridge, /buildCumulative\(region\)/);
assert.doesNotMatch(bridge, /captureWeeklyData|requestSigmaView|waitForContext|selectMuChart|readHeatmap|readCumulative|weeklyCaptureGeneration|activeWeeklyCapture|switchingToSigma/);
assert.doesNotMatch(bridge, /#cp-weekly/);
assert.match(bridge, /weekly-analysis-row/);
assert.match(bridge, /weekly-heatmap-wrap/);
assert.match(bridge, /weekly-region-toggle/);
assert.doesNotMatch(bridge, /weekly-region-only/);
assert.doesNotMatch(bridge, /weekly-region-all/);
assert.doesNotMatch(bridge, /weeklySelection/);
assert.doesNotMatch(bridge, /weekly-trend-line/);
assert.match(bridge, /weekly-region-toggle[\s\S]*aria-pressed/);
assert.doesNotMatch(bridge, /button\.click\(\)/);
assert.match(bridge, /const WEEKLY_TITLE/);
assert.match(bridge, /Global Smartphone Weekly Sell-out/);
assert.match(bridge, /const WEEKLY_DESCRIPTION/);
assert.match(bridge, /sigma-summary-list/);
assert.match(bridge, /weeklyMode/);
assert.match(bridge, /document\.addEventListener\("click", handleNavIntent, true\)/);
assert.match(bridge, /event\.stopImmediatePropagation\(\)/);
assert.match(bridge, /provider\.classList\.toggle\("open", open\)/);
assert.match(bridge, /function queueWeeklyHandoff/);
assert.match(bridge, /queueMicrotask\(\(\) => \{ if \(weeklyMode\) activateWeekly\(\); \}\)/);
assert.match(bridge, /if \(!weeklyMode\) \{ weeklyMode = true; weeklyContext = "Total"/);
assert.match(bridge, /DOMContentLoaded/);
assert.doesNotMatch(bridge, /MutationObserver/);
for (const obsolete of ["ensureStackedCardHierarchy", "alignChartBaselines", "syncMatrix", "layoutSmallLabels", "cp-weekly-stack-description"]) {
  assert.doesNotMatch(bridge, new RegExp(obsolete), `obsolete Weekly customization remains: ${obsolete}`);
}

assert.match(css, /\.sigma\.wide-dashboard \.production-layout/);
assert.match(css, /\.sigma\.wide-dashboard \.forecast-chart-row/);
assert.match(css, /\.sigma\.wide-dashboard \.forecast-side-legend/);
assert.match(css, /grid-template-columns: calc\(59\.184% \+ 4\.816px\) 96px/);
assert.match(css, /\.weekly-analysis-row/);
assert.match(css, /grid-template-columns: minmax\(0, 58fr\) minmax\(0, 42fr\)/);
assert.match(css, /weekly-cumulative-body/);
assert.match(css, /weekly-heatmap-metric/);
assert.match(css, /weekly-heatmap-wrap td\.up[\s\S]*color: #171717/);
for (const [region, color] of [["Total", "primary-deep"], ["USA", "blue-1"], ["China", "blue-2"], ["Japan", "blue-3"], ["Europe", "blue-5"], ["India", "blue-7"]]) {
  assert.match(css, new RegExp(`weekly-region-toggle\\[data-region="${region}"\\] i \\{ background: var\\(--mi-${region === "Total" ? "color-" : "chart-"}${color}\\); \\}`));
}
assert.match(css, /weekly-cumulative-total[\s\S]*font-size: 14px[\s\S]*line-height: 18px[\s\S]*font-weight: 600/);
assert.match(css, /weekly-cumulative-segment-label[\s\S]*font-size: 12px[\s\S]*line-height: 16px[\s\S]*font-weight: 500/);
assert.match(css, /weekly-cumulative-year[\s\S]*font-size: 12px[\s\S]*line-height: 16px[\s\S]*font-weight: 400/);
assert.match(css, /weekly-cumulative-legend[\s\S]*font-size: 12px[\s\S]*line-height: 16px/);
assert.match(css, /\.sigma\.wide-dashboard:has\(> \.weekly-analysis-row\) \.dashboard-insights > div > span/);
assert.match(css, /\.portal-nav \.nav-provider > span[\s\S]*color: #171717[\s\S]*font-size: 16px[\s\S]*line-height: 24px[\s\S]*font-weight: 700/);
assert.match(css, /\.portal-nav \.nav-series button[\s\S]*font-size: 14px[\s\S]*line-height: 20px[\s\S]*font-weight: 400/);
for (const obsolete of ["weekly-region-all", "weekly-region-control(?!s)", "weekly-region-only", "weekly-trend-"]) {
  assert.doesNotMatch(css, new RegExp(`\\.${obsolete}`), `obsolete Weekly CSS remains: ${obsolete}`);
}
assert.match(html, /weekly-redesign\.js\?v=20260810-26/);
assert.match(html, /portal-overrides\.css\?v=20260810-32/);

console.log("weekly Sigma-clone + analysis static contract: PASS");
