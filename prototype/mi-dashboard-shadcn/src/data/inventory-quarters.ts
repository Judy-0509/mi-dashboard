export type InventoryQuarterSelection<T extends string = string> = [T, T, T]

export function getDefaultInventoryQuarters<T extends string>(
  quarters: readonly T[],
): InventoryQuarterSelection<T> {
  const current = quarters.at(-1)!
  const previous = quarters.at(-2) ?? current
  const [year, quarter] = current.split(" ")
  const sameQuarterLastYear = quarters.find(
    (item) => item === `${Number(year) - 1} ${quarter}`,
  ) ?? quarters[0]

  return [sameQuarterLastYear, previous, current]
}
