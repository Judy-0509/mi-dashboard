import { Separator } from "@/components/ui/separator"

export type PortalPage = "sigma" | "weekly"

const providers: Array<{
  label: string
  child: string
  page: PortalPage
  href: string
}> = [
  {
    label: "SigmaIntel",
    child: "Production Forecast",
    page: "sigma",
    href: "#overview",
  },
  { label: "Counterpoint", child: "Weekly", page: "weekly", href: "#weekly" },
]

type PortalSidebarProps = {
  activePage: PortalPage
  onNavigate: (page: PortalPage) => void
}

export function PortalSidebar({
  activePage,
  onNavigate,
}: PortalSidebarProps) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r bg-sidebar px-5 py-7 text-sidebar-foreground">
      <div>
        <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
          MI Intelligence
        </p>
        <p className="mt-1.5 text-lg font-semibold tracking-tight">Portal</p>
      </div>
      <Separator className="my-7 bg-sidebar-border" />
      <nav aria-label="Research portals" className="space-y-6">
        {providers.map(({ label, child, page, href }) => {
          const active = activePage === page

          return (
            <section key={label}>
              <h2 className="text-base leading-6 font-bold">{label}</h2>
              <a
                aria-current={active ? "page" : undefined}
                className={`ms-3 mt-1.5 block px-3 py-2 text-sm leading-5 ${
                  active
                    ? "bg-sidebar-primary font-medium text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
                href={href}
                onClick={() => onNavigate(page)}
              >
                {child}
              </a>
            </section>
          )
        })}
      </nav>
    </aside>
  )
}
