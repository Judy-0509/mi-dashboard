import type { ReactNode } from "react"

type DashboardShellProps = {
  sidebar: ReactNode
  children: ReactNode
}

export function DashboardShell({ sidebar, children }: DashboardShellProps) {
  return (
    <div className="flex min-h-svh w-full min-w-[1180px] bg-background">
      {sidebar}
      <main className="min-w-0 flex-1 px-4 py-7 2xl:px-5">{children}</main>
    </div>
  )
}
