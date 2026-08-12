import assert from "node:assert/strict"

let chartSelection

try {
  chartSelection = await import("../src/lib/chart-selection.ts")
} catch {
  chartSelection = null
}

assert.ok(chartSelection, "선택 막대 윤곽 계산 모듈이 있어야 합니다.")

const { getSelectedStackOutline } = chartSelection

assert.equal(
  getSelectedStackOutline({
    selected: false,
    x: 10,
    y: 20,
    width: 40,
    parentY: 10,
    parentHeight: 110,
  }),
  null
)

assert.deepEqual(
  getSelectedStackOutline({
    selected: true,
    x: 10,
    y: 20,
    width: 40,
    parentY: 10,
    parentHeight: 110,
  }),
  { x: 11, y: 21, width: 38, height: 98 }
)

assert.equal(
  getSelectedStackOutline({
    selected: true,
    x: 10,
    y: 20,
    width: 2,
    parentY: 10,
    parentHeight: 110,
  }),
  null
)

console.log("선택 막대 윤곽 검증 통과")
