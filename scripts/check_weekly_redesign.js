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
for (const obsolete of ["ensureStackedCardHierarchy", "alignChartBaselines", "syncMatrix", "layoutSmallLabels", "viewBox", "cp-weekly-stack-description"]) {
  assert.doesNotMatch(bridge, new RegExp(obsolete), `obsolete Weekly customization remains: ${obsolete}`);
}

assert.match(css, /\.sigma\.wide-dashboard \.production-layout/);
assert.match(css, /\.sigma\.wide-dashboard \.forecast-chart-row/);
assert.match(css, /\.sigma\.wide-dashboard \.forecast-side-legend/);
assert.match(css, /grid-template-columns: calc\(59\.184% \+ 4\.816px\) 96px/);
assert.match(html, /weekly-redesign\.js\?v=20260809-16/);
assert.match(html, /portal-overrides\.css\?v=20260809-25/);

console.log("weekly Sigma-clone static contract: PASS");
