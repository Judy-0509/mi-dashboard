import type { ReactNode } from "react"

type DashboardShellProps = {
  sidebar: ReactNode
  children: ReactNode
  scrollable?: boolean
}

export function DashboardShell({
  sidebar,
  children,
  scrollable = false,
}: DashboardShellProps) {
  return (
    <div className="flex h-svh w-full min-w-[1180px] overflow-hidden bg-background">
      {sidebar}
      <main
        className={`min-w-0 flex-1 px-4 py-4 2xl:px-5 ${
          scrollable ? "overflow-y-auto" : "overflow-hidden"
        }`}
      >
        {children}
      </main>
    </div>
  )
}
