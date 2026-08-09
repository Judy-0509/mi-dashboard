import type { ReactNode } from "react"

type DashboardShellProps = {
  sidebar: ReactNode
  children: ReactNode
}

export function DashboardShell({ sidebar, children }: DashboardShellProps) {
  return (
    <div className="mx-auto flex min-h-svh min-w-[1180px] max-w-[1440px] bg-background">
      {sidebar}
      <main className="flex-1 px-10 py-9">{children}</main>
    </div>
  )
}
