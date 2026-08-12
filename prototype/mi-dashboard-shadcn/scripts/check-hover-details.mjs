import assert from "node:assert/strict"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"

let hoverDetails

try {
  hoverDetails = await import("../src/lib/hover-details.ts")
} catch {
  hoverDetails = null
}

assert.ok(hoverDetails, "hover 상세 설명 설정 모듈이 있어야 합니다.")

const {
  getHoverHighlightOpacity,
  HoverDetailsProvider,
  isHoverDetailsEnabled,
  setHoverDetailsEnabled,
  useHoverDetails,
} = hoverDetails

assert.equal(
  typeof getHoverHighlightOpacity,
  "function",
  "OFF 상태에서 hover 강조를 끄는 계산 함수가 있어야 합니다."
)

const initialState = {}
assert.equal(isHoverDetailsEnabled(initialState, "sigma"), false)
assert.equal(isHoverDetailsEnabled(initialState, "weekly"), false)

const sigmaEnabled = setHoverDetailsEnabled(initialState, "sigma", true)
assert.equal(isHoverDetailsEnabled(sigmaEnabled, "sigma"), true)
assert.equal(isHoverDetailsEnabled(sigmaEnabled, "weekly"), false)

const weeklyEnabled = setHoverDetailsEnabled(sigmaEnabled, "weekly", true)
const sigmaDisabled = setHoverDetailsEnabled(weeklyEnabled, "sigma", false)
assert.equal(isHoverDetailsEnabled(sigmaDisabled, "sigma"), false)
assert.equal(isHoverDetailsEnabled(sigmaDisabled, "weekly"), true)

assert.equal(getHoverHighlightOpacity(false, "2026 Q1", "2026 Q2"), 1)
assert.equal(getHoverHighlightOpacity(true, null, "2026 Q2"), 1)
assert.equal(getHoverHighlightOpacity(true, "2026 Q1", "2026 Q1"), 1)
assert.equal(getHoverHighlightOpacity(true, "2026 Q1", "2026 Q2"), 0.25)

function EnabledState() {
  const { enabled } = useHoverDetails()
  return React.createElement("span", null, String(enabled))
}

const renderEnabledState = (enabled) =>
  renderToStaticMarkup(
    React.createElement(
      HoverDetailsProvider,
      { enabled, onEnabledChange: () => {} },
      React.createElement(EnabledState)
    )
  )

assert.equal(renderEnabledState(false), "<span>false</span>")
assert.equal(renderEnabledState(true), "<span>true</span>")

console.log("Hover 상세 설명 설정 검증 통과")
