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
assert.doesNotMatch(bridge, /MutationObserver/);
assert.match(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
assert.match(css, /width: min\(100%, 760px\)/);
assert.match(css, /padding: 0 18px 3px 8px/);
assert.match(css, /--cp-chart-number-size: 14px !important/);
assert.match(css, /font-size: 12px !important/);
assert.match(css, /font-size: 12px;[\s\S]*line-height: 16px;[\s\S]*letter-spacing: 1\.56px/);
assert.match(html, /weekly-redesign\.js\?v=20260809-10/);
assert.match(html, /portal-overrides\.css\?v=20260809-20/);

console.log("weekly redesign static contract: PASS");
