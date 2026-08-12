export function InventoryQuarterSelect<T extends string>({
  availableQuarters,
  index,
  onChange,
  value,
}: {
  availableQuarters: readonly T[]
  index: number
  onChange: (index: number, quarter: T) => void
  value: T
}) {
  return (
    <select
      aria-label={`Inventory 비교 분기 ${index + 1}`}
      className="type-control-label h-7 w-full min-w-0 border bg-background px-1 text-center text-foreground"
      onChange={(event) => onChange(index, event.target.value as T)}
      value={value}
    >
      {availableQuarters.map((quarter) => (
        <option key={quarter} value={quarter}>{quarter}</option>
      ))}
    </select>
  )
}
