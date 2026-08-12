import { useState } from "react"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export type PortalPage =
  | "sigma"
  | "weekly"
  | "ani"
  | "sell-through"
  | "flagship-sales"
  | "pipeline-check"
  | "pipeline-check-iphone"
  | "latest-results"
  | "mi-insight"
  | "mi-weekly-sell-through"

const providers: Array<{
  label: string
  children: Array<{
    child: string
    page: PortalPage
    href: string
  }>
}> = [
  {
    label: "SigmaIntel",
    children: [
      {
        child: "Production Forecast",
        page: "sigma",
        href: "#overview",
      },
    ],
  },
  {
    label: "Counterpoint",
    children: [
      { child: "Weekly", page: "weekly", href: "#weekly" },
      {
        child: "Sell-in / Sell-through",
        page: "sell-through",
        href: "#sell-through",
      },
      {
        child: "Flagship Sales",
        page: "flagship-sales",
        href: "#flagship-sales",
      },
    ],
  },
  {
    label: "MI TAM",
    children: [
      {
        child: "Pipeline Check",
        page: "pipeline-check",
        href: "#pipeline-check",
      },
      {
        child: "Pipeline Check (iPhone)",
        page: "pipeline-check-iphone",
        href: "#pipeline-check-iphone",
      },
      {
        child: "Latest Results",
        page: "latest-results",
        href: "#latest-results",
      },
    ],
  },
  {
    label: "MI Insight",
    children: [
      {
        child: "Weekly Report",
        page: "mi-insight",
        href: "#mi-insight",
      },
      {
        child: "Weekly Sell-through",
        page: "mi-weekly-sell-through",
        href: "#mi-weekly-sell-through",
      },
    ],
  },
  {
    label: "ANI",
    children: [
      {
        child: "iPhone Model Production",
        page: "ani",
        href: "#ani",
      },
    ],
  },
]

type PortalSidebarProps = {
  activePage: PortalPage
  onNavigate: (page: PortalPage) => void
}

export function PortalSidebar({
  activePage,
  onNavigate,
}: PortalSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={`relative flex shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-150 ${collapsed ? "w-10" : "w-64"}`}>
      <div className={collapsed ? "flex justify-center pt-5" : "absolute top-5 right-3"}>
        <Button
          aria-expanded={!collapsed}
          aria-label={collapsed ? "네비게이션바 펼치기" : "네비게이션바 접기"}
          onPress={() => setCollapsed((value) => !value)}
          size="icon-sm"
          variant="ghost"
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
      </div>
      {!collapsed && (
        <div className="px-5 py-7">
          <div>
            <p className="type-eyebrow text-muted-foreground">
              MI Intelligence
            </p>
            <p className="type-card-title mt-1.5 tracking-tight">Portal</p>
          </div>
          <Separator className="my-7 bg-sidebar-border" />
          <nav aria-label="Research portals" className="space-y-6">
            {providers.map(({ label, children }) => (
              <section key={label}>
                <h2 className="type-section-title">{label}</h2>
                {children.map(({ child, page, href }) => {
                  const active = activePage === page

                  return (
                    <a
                      aria-current={active ? "page" : undefined}
                      className={`type-control ms-3 mt-1.5 block px-3 py-2 ${
                        active
                          ? "bg-sidebar-primary font-semibold text-sidebar-primary-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent"
                      }`}
                      href={href}
                      key={page}
                      onClick={() => onNavigate(page)}
                    >
                      {child}
                    </a>
                  )
                })}
              </section>
            ))}
          </nav>
        </div>
      )}
    </aside>
  )
}
