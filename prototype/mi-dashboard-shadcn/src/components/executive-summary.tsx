import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { executiveSummary } from "@/data/production"

export function ExecutiveSummary() {
  return (
    <Card className="my-4 border-border shadow-none" size="sm">
      <CardHeader className="pb-2">
        <CardTitle className="type-executive-title">
          Executive Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="type-executive-body grid gap-2 text-muted-foreground">
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
