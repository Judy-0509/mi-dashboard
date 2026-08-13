import type { JSX } from "react"
import { ExternalLink } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getMiInsightReports } from "@/data/mi-insight"

export function MiInsightWeeklyReport(): JSX.Element {
  const reports = getMiInsightReports()

  return (
    <div className="space-y-4">
      <Card className="border-border shadow-none" size="sm">
        <CardHeader className="pb-2">
          <CardTitle className="type-executive-title">
            Weekly Report Files
          </CardTitle>
        </CardHeader>
        <CardContent className="min-w-0">
          <div className="max-h-[520px] overflow-x-hidden overflow-y-auto">
            <table className="type-table-body w-full table-fixed border-collapse">
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
              <thead className="type-table-header border-b border-border text-left text-muted-foreground">
                <tr>
                  <th className="px-2 py-2" scope="col">
                    파일명
                  </th>
                  <th className="px-2 py-2" scope="col">
                    조사기관
                  </th>
                  <th className="px-2 py-2" scope="col">
                    응용처
                  </th>
                  <th className="px-2 py-2" scope="col">
                    주기
                  </th>
                  <th className="px-2 py-2" scope="col">
                    업로드일자
                  </th>
                  <th className="px-2 py-2" scope="col">
                    공유내용
                  </th>
                  <th className="px-2 py-2" scope="col">
                    파일 EDM 링크
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reports.map((report) => (
                  <tr key={report.fileName}>
                    <td className="type-table-header px-2 py-3 align-top break-words">
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
                    <td className="type-table-body px-2 py-3 align-top tabular-nums whitespace-nowrap">
                      {report.uploadDate}
                    </td>
                    <td className="px-2 py-3 align-top">
                      <p className="type-table-body line-clamp-2">
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
