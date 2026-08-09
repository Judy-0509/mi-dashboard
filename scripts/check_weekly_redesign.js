const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const bridge = read("site/assets/weekly-redesign.js");
const bundle = read("site/assets/index-DdGOxX2Y.js");
const css = read("site/assets/portal-overrides.css");
const html = read("site/index.html");

for (const hook of ["cp-report-main", "cp-weekly", "cp-matrix", "cp-regional"]) {
  assert.ok(bundle.includes(hook), `missing bundle hook: ${hook}`);
}

assert.match(bridge, /\["Total", "USA", "China", "Japan", "Europe", "India"\]/);
assert.match(bridge, /#cp-weekly \.market-list \.lead/);
assert.match(bridge, /#cp-weekly \.rollup-line/);
assert.match(bridge, /DOMContentLoaded/);
assert.match(bridge, /setTimeout\(schedule, 80\)/);
assert.match(bridge, /viewBox", "80 0 740 320"/);
assert.match(bridge, /height < 16/);
assert.match(bridge, /toggleAttribute\("hidden"/);
assert.match(bridge, /function alignChartBaselines/);
assert.match(bridge, /function ensureStackedCardHierarchy/);
assert.match(bridge, /const context = overview \? "Total" : activeContext/);
assert.match(bridge, /Region별 누적 판매 구성/);
assert.match(bridge, /누적 Total 범위/);
assert.match(bridge, /setTimeout\(schedule, 160\)/);
assert.doesNotMatch(bridge, /MutationObserver/);
assert.match(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
assert.match(css, /width: min\(100%, 760px\)/);
assert.match(css, /padding: 0 18px 3px 8px/);
assert.match(css, /--cp-chart-number-size: 14px !important/);
assert.match(css, /font-size: 12px !important/);
assert.match(css, /grid-template-columns: minmax\(0, 1fr\) 108px/);
assert.match(css, /flex-direction: column/);
assert.match(css, /height: 299px/);
assert.match(css, /grid-template-rows: 62px 22px 22px minmax\(0, 1fr\)/);
assert.match(css, /cp-weekly-stack-description/);
assert.match(css, /cp-weekly-stack-info-value/);
assert.match(css, /\.cp-report-chart-head > span/);
assert.match(css, /font-size: 12px;[\s\S]*line-height: 16px;[\s\S]*letter-spacing: 1\.56px/);
assert.match(html, /weekly-redesign\.js\?v=20260809-15/);
assert.match(html, /portal-overrides\.css\?v=20260809-25/);

console.log("weekly redesign static contract: PASS");
