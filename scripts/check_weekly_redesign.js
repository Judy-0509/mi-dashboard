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

assert.match(bridge, /function ensureSummary/);
assert.match(bridge, /#cp-weekly \.market-list \.lead/);
assert.match(bridge, /#cp-weekly \.rollup-line/);
assert.match(bridge, /function requestSigmaView/);
assert.match(bridge, /captureWeeklyData/);
assert.match(bridge, /WEEKLY_REGIONS/);
assert.match(bridge, /cp-report-hover-value/);
assert.match(bridge, /values\.length === 32/);
assert.match(bridge, /values\.every\(\(value\) => Number\.isFinite\(value\)\)/);
assert.match(bridge, /elapsed <= 1600/);
assert.match(bridge, /weeklyCaptureGeneration/);
assert.match(bridge, /activeWeeklyCapture/);
assert.match(bridge, /activeWeeklyCapture\?\.generation === weeklyCaptureGeneration/);
assert.match(bridge, /main\.isConnected/);
assert.match(bridge, /document\.querySelector\("#cp-report-main"\) !== main/);
assert.match(bridge, /headers\.length !== WEEKLY_REGIONS\.length/);
assert.match(bridge, /rows\.length !== 8/);
assert.match(bridge, /row\.values\.length !== 6/);
assert.match(bridge, /new Set\(labels\)\.size !== 8/);
assert.match(bridge, /weekly-analysis-row/);
assert.match(bridge, /weekly-heatmap-wrap/);
assert.match(bridge, /weekly-region-toggle/);
assert.match(bridge, /weekly-region-only/);
assert.match(bridge, /weekly-region-all/);
assert.match(bridge, /all\.setAttribute\("aria-pressed"/);
assert.match(bridge, /weekly-region-toggle[\s\S]*aria-pressed/);
assert.match(bridge, /W1–W32/);
assert.match(bridge, /button\.click\(\)/);
assert.match(bridge, /const WEEKLY_TITLE/);
assert.match(bridge, /Global Smartphone Weekly Sell-out/);
assert.match(bridge, /const WEEKLY_DESCRIPTION/);
assert.match(bridge, /sigma-summary-list/);
assert.match(bridge, /weeklyMode/);
assert.match(bridge, /switchingToSigma/);
assert.match(bridge, /DOMContentLoaded/);
assert.match(bridge, /setTimeout\(schedule, 80\)/);
assert.match(bridge, /setTimeout\(schedule, 160\)/);
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
assert.match(html, /weekly-redesign\.js\?v=20260809-21/);
assert.match(html, /portal-overrides\.css\?v=20260809-26/);

console.log("weekly Sigma-clone + analysis static contract: PASS");
