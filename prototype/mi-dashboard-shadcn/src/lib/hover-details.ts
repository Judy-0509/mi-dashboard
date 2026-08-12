import { createContext, createElement, useContext, type ReactNode } from "react"

export type HoverDetailsByPage<Page extends string> = Partial<
  Record<Page, boolean>
>

export function isHoverDetailsEnabled<Page extends string>(
  state: HoverDetailsByPage<Page>,
  page: Page
) {
  return state[page] ?? false
}

export function setHoverDetailsEnabled<Page extends string>(
  state: HoverDetailsByPage<Page>,
  page: Page,
  enabled: boolean
) {
  return { ...state, [page]: enabled }
}

export function getHoverHighlightOpacity(
  enabled: boolean,
  hoveredKey: string | null,
  itemKey: string
) {
  return enabled && hoveredKey && hoveredKey !== itemKey ? 0.25 : 1
}

type HoverDetailsContextValue = {
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
}

const HoverDetailsContext = createContext<HoverDetailsContextValue | null>(null)

export function HoverDetailsProvider({
  children,
  enabled,
  onEnabledChange,
}: HoverDetailsContextValue & { children: ReactNode }) {
  return createElement(
    HoverDetailsContext.Provider,
    { value: { enabled, onEnabledChange } },
    children
  )
}

export function useHoverDetails() {
  const context = useContext(HoverDetailsContext)

  if (!context) {
    throw new Error(
      "useHoverDetails must be used within a <HoverDetailsProvider />"
    )
  }

  return context
}
