import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { executiveSummary } from "@/data/production"

export function ExecutiveSummary() {
  return (
    <Card className="my-6 border-border shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold tracking-[0.14em] uppercase">
          Executive Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-3 text-sm leading-6 text-muted-foreground">
          {executiveSummary.map((observation) => (
            <li className="flex gap-3" key={observation}>
              <span
                aria-hidden="true"
                className="mt-2 size-1.5 shrink-0 bg-primary"
              />
              <span>{observation}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
