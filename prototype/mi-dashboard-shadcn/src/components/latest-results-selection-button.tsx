import type * as React from "react"

export function LatestResultsSelectionButton({
  children,
  onClick,
  pressed,
}: {
  children: React.ReactNode
  onClick: () => void
  pressed: boolean
}) {
  return (
    <button
      aria-pressed={pressed}
      className={`type-control min-h-8 rounded-md border px-3 py-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
        pressed
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background hover:bg-muted"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}
