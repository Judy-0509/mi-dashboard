export function getTotalLabelOffsets(
  values: readonly number[],
  chartHeight: number,
  yMaximum: number,
) {
  const pixelsPerUnit = (chartHeight - 60) / yMaximum
  let previousY: number | null = null

  return values.map((value) => {
    const baseY = -value * pixelsPerUnit
    const offset = [0, -18, -36].find(
      (candidate) =>
        previousY === null || Math.abs(baseY + candidate - previousY) >= 15,
    ) ?? -36
    previousY = baseY + offset
    return offset
  })
}
