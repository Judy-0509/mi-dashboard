import { Separator } from "@/components/ui/separator"

const providers = [
  { label: "SigmaIntel", child: "Production Forecast", active: true },
  { label: "Counterpoint", child: "Weekly", active: false },
]

export function PortalSidebar() {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r bg-sidebar px-5 py-7 text-sidebar-foreground">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          MI Intelligence
        </p>
        <p className="mt-1.5 text-lg font-semibold tracking-tight">Portal</p>
      </div>
      <Separator className="my-7 bg-sidebar-border" />
      <nav aria-label="Research portals" className="space-y-6">
        {providers.map(({ label, child, active }) => (
          <section key={label}>
            <h2 className="text-base font-bold leading-6">{label}</h2>
            <a
              aria-current={active ? "page" : undefined}
              className={`mt-1.5 block ms-3 px-3 py-2 text-sm leading-5 ${
                active
                  ? "bg-sidebar-primary font-medium text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
              href="#overview"
            >
              {child}
            </a>
          </section>
        ))}
      </nav>
    </aside>
  )
}
