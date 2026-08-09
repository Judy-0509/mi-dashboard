import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { weeklyExecutiveSummary } from "@/data/weekly"

export function WeeklyExecutiveSummary() {
  return (
    <Card className="my-4 border-border shadow-none" size="sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold tracking-[0.14em] uppercase">
          Executive Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-2 text-sm leading-5 text-muted-foreground">
          {weeklyExecutiveSummary.map((summary) => (
            <li className="flex gap-3" key={summary}>
              <span
                aria-hidden="true"
                className="mt-2 size-1.5 shrink-0 bg-primary"
              />
              <span>{summary}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
