import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const observations = [
  "2026 Q3 현재 누적 Forecast는 484.0Mu로, 6개월 전 대비 +22.7Mu (+4.9%) 조정됨",
  "업체별로는 Transsion +9.8Mu가 가장 큰 상향, OPPO -3.8Mu가 가장 큰 하향임",
]

export function ExecutiveSummary() {
  return (
    <Card className="my-6 border-border shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-[0.14em]">
          Executive Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-3 text-sm leading-6 text-muted-foreground">
          {observations.map((observation) => (
            <li className="flex gap-3" key={observation}>
              <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 bg-primary" />
              <span>{observation}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
