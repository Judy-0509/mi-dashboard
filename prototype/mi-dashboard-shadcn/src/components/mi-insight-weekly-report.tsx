import type { JSX } from "react"
import { ExternalLink } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getMiInsightReports, miInsightInsights } from "@/data/mi-insight"

export function MiInsightWeeklyReport(): JSX.Element {
  const reports = getMiInsightReports()

  return (
    <div className="space-y-4">
      <Card className="border-border shadow-none" size="sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold tracking-[0.14em] uppercase">
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 text-sm leading-5 text-muted-foreground">
            {miInsightInsights.map((insight) => (
              <li className="flex gap-3" key={insight}>
                <span
                  aria-hidden="true"
                  className="mt-2 size-1.5 shrink-0 bg-primary"
                />
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-border shadow-none" size="sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold tracking-[0.14em] uppercase">
            Weekly Report Files
          </CardTitle>
        </CardHeader>
        <CardContent className="min-w-0">
          <div className="max-h-[520px] overflow-x-hidden overflow-y-auto">
            <table className="w-full table-fixed border-collapse text-xs">
              <caption className="sr-only">
                MI Insight Weekly Report files
              </caption>
              <colgroup>
                <col className="w-[17%]" />
                <col className="w-[11%]" />
                <col className="w-[13%]" />
                <col className="w-[8%]" />
                <col className="w-[12%]" />
                <col className="w-[27%]" />
                <col className="w-[12%]" />
              </colgroup>
              <thead className="border-b border-border text-left text-muted-foreground">
                <tr>
                  <th className="px-2 py-2 font-medium" scope="col">
                    파일명
                  </th>
                  <th className="px-2 py-2 font-medium" scope="col">
                    조사기관
                  </th>
                  <th className="px-2 py-2 font-medium" scope="col">
                    응용처
                  </th>
                  <th className="px-2 py-2 font-medium" scope="col">
                    주기
                  </th>
                  <th className="px-2 py-2 font-medium" scope="col">
                    업로드일자
                  </th>
                  <th className="px-2 py-2 font-medium" scope="col">
                    공유내용
                  </th>
                  <th className="px-2 py-2 font-medium" scope="col">
                    파일 EDM 링크
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reports.map((report) => (
                  <tr key={report.fileName}>
                    <td className="px-2 py-3 align-top font-medium break-words">
                      {report.fileName}
                    </td>
                    <td className="px-2 py-3 align-top break-words">
                      {report.researchProvider}
                    </td>
                    <td className="px-2 py-3 align-top break-words">
                      {report.useCase}
                    </td>
                    <td className="px-2 py-3 align-top whitespace-nowrap">
                      {report.cadence}
                    </td>
                    <td className="px-2 py-3 align-top font-mono whitespace-nowrap">
                      {report.uploadDate}
                    </td>
                    <td className="px-2 py-3 align-top">
                      <p className="line-clamp-2 leading-5">
                        {report.sharedContent}
                      </p>
                    </td>
                    <td className="px-2 py-3 align-top break-words">
                      {report.edmUrl ? (
                        <a
                          aria-label={`원본 보기: ${report.fileName}`}
                          className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
                          href={report.edmUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <ExternalLink
                            aria-hidden="true"
                            className="size-3.5 shrink-0"
                          />
                          원본 보기
                        </a>
                      ) : (
                        <span className="text-muted-foreground">
                          원본 링크 없음
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
